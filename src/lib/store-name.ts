/**
 * 店铺名称规范化：
 * 认证/后台录入时，把城市拼进 name，形成「店名(城市)」作为唯一业务键，
 * 这样既能在同名店之间靠城市区分，也便于后台「一个名字 = 一家店铺」管理。
 * 已带城市后缀的会自动去重，避免反复拼接。
 */
export function normalizeStoreName(raw: string, city?: string | null): string {
  let n = (raw || "").trim();
  if (!n) return n;
  // 去掉末尾已有的 (城市) / （城市）
  n = n.replace(/[（(][^（）()]*[)）]\s*$/, "").trim();
  if (city && city.trim()) {
    n = `${n}(${city.trim()})`;
  }
  return n;
}
