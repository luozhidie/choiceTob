# 富途中继（broker-relay）

常驻在 VPS 上的小服务，连接富途 OpenD 网关，向 Vercel（Next.js 无服务器函数）暴露
简洁的 HTTP 接口。Next.js 侧只需一次 `fetch` 即可下单，自己不持有任何连接状态。

```
Vercel 定时任务 → /api/finance/signal (runStrategy)
                     → FutuBrokerExecutor（src/lib/broker/futu.ts）
                        → HTTP POST http://<vps>:3001/order
                           → 本中继 → OpenD → 富途后台
```

> 为什么需要它：富途 OpenD 网关是**常驻进程**，Vercel 无服务器函数（最长 60s、用完即毁）
> 养不住它。OpenD 本就要常驻一台主机，中继与之一起跑，Vercel 只发 HTTP 指令。

---

## 一、前置：去哪里拿「API 连接」

| 需要的东西 | 去哪里拿 |
|-----------|---------|
| 富途账户（牛牛号） | 富途官网 futunn.com 或「富途牛牛」App 开户，完成身份 KYC |
| OpenD 网关程序 | 富途开放接口下载页（futunn.com/OpenAPI 或帮助中心搜「Futu API 下载」），选你服务器系统（Ubuntu/CentOS/Windows/macOS） |
| OpenD 的 WebSocket 端口 | 启动 OpenD 后看它的日志，或 `FutuOpenD.xml` 里的 `api_port`，填到 `FUTU_OPEND_PORT` |
| 模拟交易环境 | **无需申请**——OpenD 自带模拟环境，`FUTU_TRD_ENV=SIMULATE` 即可下单验证，免解锁密码 |
| 真实交易解锁密码 | 牛牛 App 里设置的「交易密码」，填到 `FUTU_UNLOCK_PWD`（仅真实环境需要） |
| 常驻主机（VPS） | 阿里云/腾讯云轻量、AWS、Railway、Fly.io 等任意能 7×24 跑 Node 的机器 |

---

## 二、部署与运行（在 VPS 上）

```bash
cd broker-relay
npm install
cp .env.example .env      # 编辑 .env，至少填 FUTU_OPEND_HOST/PORT
node server.mjs           # 或 npm start / 用 pm2、systemd、docker 保活
```

先拿**模拟环境**跑通：`.env` 里 `FUTU_TRD_ENV=SIMULATE`，不设解锁密码。

健康检查：
```bash
curl http://127.0.0.1:3001/health
# {"ok":true,"ready":true,"accID":...,"trdEnv":"SIMULATE","trdMarket":1}
```

手动试下一单（模拟）：
```bash
curl -X POST http://127.0.0.1:3001/order \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"HK.02020","side":"BUY","price":80.0,"qty":100}'
```

查持仓：
```bash
curl http://127.0.0.1:3001/positions
```

---

## 三、Vercel 侧配置

在 Vercel 项目环境变量中加入：
- `BROKER_TYPE=futu`
- `FUTU_RELAY_URL=http://<你的VPS公网IP>:3001`
- `RELAY_API_TOKEN=<与 .env 中相同的随机串>`（建议开启，校验调用来源）

> 安全：VPS 防火墙只放行 Vercel 出口 IP（或仅放行设置了正确 `x-api-token` 的请求）；
> 中继不要直接暴露到公网无鉴权。

---

## 四、切到真实交易（确认真的要实盘时）

1. 确认 `.env`：`FUTU_TRD_ENV=REAL`、`FUTU_UNLOCK_PWD=你的交易密码`。
2. 重启中继，看日志 `解锁交易: 成功`。
3. 先在牛牛 App 里小资金验证一笔，再放开策略自动下单。
4. 策略本身（`src/lib/signal.ts` 的 MA/RSI/量比/止损）一行不用改——
   它只依赖 `OrderExecutor` 接口，真实下单由本中继完成。

---

## 五、接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/health`    | 就绪状态（是否连上 OpenD、accID、环境） |
| POST | `/order`     | 下单，body: `{symbol, side:"BUY"|"SELL", price, qty}`（symbol 为富途格式 HK.02020/US.AAPL） |
| GET  | `/positions` | 当前持仓列表 |

所有响应为 JSON；出错时返回 `{error: "..."}`。
