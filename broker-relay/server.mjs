// 富途中继（broker-relay）
// ─────────────────────────────────────────────────────────────
// 作用：常驻在 VPS（与 OpenD 网关同机），连接 OpenD，向 Vercel 暴露
//       简洁的 HTTP 接口（/order、/positions、/health）。
//       这样 Next.js 无服务器函数保持无状态，下单只需一次 fetch。
//
// 说明：富途 JS SDK 是「低层协议封装」——公开方法(PlaceOrder 等)接收的是
//       【已编码的 protobuf 字节】，返回 {error, errmsg, buff}，需自行
//       用 protoRoot 解码。本文件即按此模式实现（已对照 futu-api 源码核对）。
//
// 重要：真实环境交易需先 unlock；下单前务必用 SIMULATE 跑通验证！
// ─────────────────────────────────────────────────────────────

import http from "node:http";
import { createHash } from "node:crypto";
import ftWebsocket from "futu-api";
import protoRoot from "futu-api/proto.js";
import protobuf from "protobufjs";

// ── 配置（环境变量，详见 .env.example）──
const CFG = {
  opendHost: process.env.FUTU_OPEND_HOST || "127.0.0.1",
  opendPort: parseInt(process.env.FUTU_OPEND_PORT || "11111", 10),
  trdEnv: (process.env.FUTU_TRD_ENV || "SIMULATE").toUpperCase() === "REAL" ? 1 : 0, // 0=Simulate 1=Real
  trdMarket: parseInt(process.env.FUTU_TRD_MARKET || "1", 10), // 1=HK 2=US
  securityFirm: parseInt(process.env.FUTU_SECURITY_FIRM || "1", 10), // 1=FutuHK
  unlockPwd: process.env.FUTU_UNLOCK_PWD || "", // 仅真实环境需要（明文，仅本机中继使用）
  port: parseInt(process.env.RELAY_PORT || "3001", 10),
  host: process.env.RELAY_HOST || "0.0.0.0",
  apiToken: process.env.RELAY_API_TOKEN || "", // 可选：Vercel 调用时带 x-api-token 校验
};

// 枚举（与 Trd_Common.proto 一致）
const TrdSide = { BUY: 1, SELL: 2 };
const OrderType = { NORMAL: 1 };
const METHOD = {
  Trd_PlaceOrder: "PlaceOrder",
  Trd_UnlockTrade: "UnlockTrade",
  Trd_GetAccList: "GetAccList",
  Trd_GetPositionList: "GetPositionList",
};
const WRITE_OPS = new Set(["Trd_PlaceOrder", "Trd_UnlockTrade", "Trd_ModifyOrder"]);

let ACC_ID = 0;
let serialNo = 0;

// ── OpenD 连接 ──
function connectOpenD() {
  ftWebsocket.setWsConfig(CFG.opendHost, CFG.opendPort);
  ftWebsocket.onlogin = (ok) => {
    if (ok) {
      console.log("[relay] OpenD 登录成功");
      initAccount();
    } else {
      console.error("[relay] OpenD 登录失败（检查 OpenD 是否运行 / 地址端口是否正确）");
    }
  };
  ftWebsocket.initWebSocket(); // 断线自动重连
}

function md5(s) {
  return createHash("md5").update(s, "utf8").digest("hex");
}

function packetID() {
  return { connID: ftWebsocket.getConnID(), serialNo: ++serialNo };
}

function trdHeader() {
  return { trdEnv: CFG.trdEnv, accID: ACC_ID, trdMarket: CFG.trdMarket };
}

// 统一调用：编码 → 发送 → 解码 → 业务校验
async function callTrade(protoName, c2sFields) {
  const PB = protoRoot.lookup(protoName + ".Request");
  const reqObj = { c2s: { ...c2sFields } };
  if (WRITE_OPS.has(protoName)) reqObj.c2s.packetID = packetID();
  const bytes = PB.encode(PB.create(reqObj)).finish();
  const method = METHOD[protoName];
  const res = await ftWebsocket[method](bytes);
  if (!res || res.error) throw new Error("传输层错误 " + (res?.errmsg || res?.error));
  const Resp = protoRoot.lookup(protoName + ".Response");
  // 注意：retType/retMsg 在 Response 顶层，不在 s2c 内
  const decoded = Resp.decode(protobuf.util.newBuffer(res.buff));
  if (decoded.retType !== 0) throw new Error("业务错误 " + (decoded.retMsg || decoded.errCode));
  return decoded.s2c;
}

async function initAccount() {
  try {
    const s2c = await callTrade("Trd_GetAccList", {});
    const list = s2c.accList || [];
    const acc =
      list.find((a) => a.trdEnv === CFG.trdEnv && (a.trdMarketAuthList || []).includes(CFG.trdMarket)) ||
      list.find((a) => a.trdEnv === CFG.trdEnv);
    if (!acc) {
      console.error("[relay] 未找到匹配账户", { trdEnv: CFG.trdEnv, trdMarket: CFG.trdMarket, list });
      return;
    }
    ACC_ID = Number(acc.accID);
    console.log("[relay] 使用账户 accID=", ACC_ID, " trdEnv=", CFG.trdEnv, " trdMarket=", CFG.trdMarket);
    if (CFG.trdEnv === 1 && CFG.unlockPwd) {
      const r = await callTrade("Trd_UnlockTrade", {
        unlock: true,
        pwdMD5: md5(CFG.unlockPwd),
        securityFirm: CFG.securityFirm,
      });
      console.log("[relay] 解锁交易:", r?.retType === 0 ? "成功" : "失败");
    }
  } catch (e) {
    console.error("[relay] initAccount 失败:", e.message);
  }
}

// ── HTTP 服务 ──
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(body);
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Origin": "*" }); return res.end(); }
  try {
    const url = new URL(req.url, "http://localhost");
    if (CFG.apiToken && req.headers["x-api-token"] !== CFG.apiToken) {
      return json(res, 401, { error: "unauthorized" });
    }

    if (url.pathname === "/health") {
      return json(res, 200, {
        ok: true,
        ready: ftWebsocket.isReadyConnect(),
        accID: ACC_ID,
        trdEnv: CFG.trdEnv === 1 ? "REAL" : "SIMULATE",
        trdMarket: CFG.trdMarket,
      });
    }

    if (url.pathname === "/order" && req.method === "POST") {
      if (!ACC_ID) return json(res, 503, { error: "账户未就绪，OpenD 可能未连接或登录失败" });
      const b = await readJson(req);
      if (!b.symbol || !b.side || b.qty == null || b.price == null) {
        return json(res, 400, { error: "缺少参数 symbol/side/qty/price" });
      }
      const s2c = await callTrade("Trd_PlaceOrder", {
        header: trdHeader(),
        trdSide: b.side === "BUY" ? TrdSide.BUY : TrdSide.SELL,
        orderType: OrderType.NORMAL,
        code: b.symbol, // 已是富途格式，如 HK.02020 / US.AAPL
        qty: Number(b.qty),
        price: Number(b.price),
        remark: "lzd-" + Date.now(),
      });
      return json(res, 200, {
        ok: true,
        orderID: s2c.orderID != null ? s2c.orderID.toString() : undefined,
        orderIDEx: s2c.orderIDEx,
      });
    }

    if (url.pathname === "/positions" && req.method === "GET") {
      if (!ACC_ID) return json(res, 503, { error: "账户未就绪" });
      const s2c = await callTrade("Trd_GetPositionList", { header: trdHeader() });
      // uint64 字段(protobufjs 解码为 Long)转成可读的 字符串/数字
      const positions = (s2c.positionList || []).map((p) => ({
        code: p.code,
        name: p.name,
        qty: Number(p.qty),
        price: Number(p.price),
        costPrice: p.costPrice != null ? Number(p.costPrice) : null,
        plVal: p.plVal != null ? Number(p.plVal) : null,
        positionID: p.positionID != null ? p.positionID.toString() : undefined,
      }));
      return json(res, 200, { ok: true, positions });
    }

    return json(res, 404, { error: "not found" });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
});

connectOpenD();
server.listen(CFG.port, CFG.host, () => {
  console.log(`[relay] 富途中继已启动: http://${CFG.host}:${CFG.port}  (trdEnv=${CFG.trdEnv === 1 ? "REAL" : "SIMULATE"}, market=${CFG.trdMarket})`);
});
