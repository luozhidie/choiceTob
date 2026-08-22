import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// ============================================================
// 代理预存货款系统：共享工具
//  - 支付密码哈希（Node 内置 scrypt，零依赖）
//  - 银行卡号 AES-256-GCM 加密（应用层，密钥走环境变量）
//  - 《预充货款协议》文本与版本
// ============================================================

// ---------- 支付密码哈希 ----------
const SCRYPT_KEYLEN = 64;

export function hashPaymentPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export function verifyPaymentPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
    const expected = Buffer.from(hash, "hex");
    if (expected.length !== derived.length) return false;
    return timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

// ---------- 银行卡号加密 ----------
function getCardKey(): Buffer {
  const k = process.env.CARD_ENC_KEY;
  if (!k) throw new Error("服务器配置错误：缺少 CARD_ENC_KEY");
  return Buffer.from(k, "hex");
}

export function encryptCardNo(cardNo: string): string {
  const { createCipheriv, randomBytes } = require("crypto");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getCardKey(), iv);
  const enc = Buffer.concat([cipher.update(cardNo, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptCardNo(payload: string): string {
  const { createDecipheriv } = require("crypto");
  const [ivHex, tagHex, encHex] = payload.split(":");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getCardKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

// ---------- 协议文本 ----------
export const PRE_DEPOSIT_AGREEMENT_VERSION = "v1";

export const PRE_DEPOSIT_AGREEMENT_TEXT = `《预充货款协议》（批发供货条款）版本 v1

一、主体与关系
1. 平台（"本店/供货方"）是服装批发供货商，仅收取批发货款、按批发价发货、承担供货责任。
2. 您（"批发客户/代销方"）通过本平台一手拿货或批量拿货，可自行零售；您赚取零售与批发的差价，并对您自己的客户负责售后。

二、预存货款性质
1. 您充值即视为预存货款，并非存款、理财或投资，不产生任何利息。
2. 预存货款仅用于在本店拿货抵扣货款，不退现、不提现。
3. 未使用的货款余额可协商退还（不承诺随时退）；已享受折扣的已消费部分不予退还。

三、发货与退换
1. 本店为批发供货，货物一经寄出，不退不换（质量问题除外，另行协商）。
2. 充值金额达到 5 万元及以上的批发客户，享有分级退换额度（5%/10%/20%），具体以账户显示为准。

四、佣金与结算
1. 若您通过专属链接产生销售，平台在货物发出后，将零售与批发的差价结算至您的可提现佣金。
2. 佣金属劳务/经营所得，平台将依法提示应扣个税，实际代缴由平台线下完成。
3. 佣金提现仅限佣金余额，预存货款本金不可提现。

五、责任与合规
1. 平台作为供货方仅收取批发价款，未赚取零售溢价，不对您客户的售后承担连带责任；您自愿对您客户做售后。
2. 本协议不涉及任何"充值返现""固定收益""资金池"等表述，您理解预存货款为正常的批发预付款。

六、其他
1. 本协议条款如有变更，以平台最新版本为准，您继续使用视为接受。
2. 如有争议，双方友好协商解决。`;

export function agreementContentHash(text: string): string {
  const { createHash } = require("crypto");
  return createHash("sha256").update(text, "utf8").digest("hex");
}
