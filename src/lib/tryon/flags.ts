// 虚拟试衣 · 能力开关
// 专业版依赖更高质量的试衣引擎（Genlook 额度 / FASHN key），
// 在拿到稳定通道并完成测试衣验收前，默认关闭专业版入口，只开放普通版。
// 开放方式：Vercel 环境变量 TRYON_PRO_ENABLED=true，无需改代码。

export const TRYON_PRO_ENABLED = process.env.TRYON_PRO_ENABLED === "true";

/** 服务端（API 路由）判定时同样读环境变量，避免客户端常量被打包固化 */
export function tryonProEnabled(): boolean {
  return process.env.TRYON_PRO_ENABLED === "true";
}
