/**
 * CMB 知识库（穿搭判定逻辑）
 * ───────────────────────────────────────────────────────────
 * 判定轴（用户定义，不可改）：
 *   · 色彩季型 → 看整体颜色的「明度(深/浅) + 艳度(净/浊) + 冷暖(暖/冷)」三轴呈现
 *   · 穿衣风格 → 看「面料 + 剪裁 + 图案」三者整体呈现
 *
 * 下方 SEASON_LOGIC / STYLE_LOGIC 目前为空，由运营/买手按本体系专业表述填充。
 * 填充格式见各条目注释。填充后 AI 判定即按你的体系生效。
 * 修改方式：直接给 SEASON_LOGIC[code] / STYLE_LOGIC[code] 赋值即可，其它代码不动。
 */

export const SEASON_LOGIC: Record<string, string> = {
  // 格式示例（请按本体系专业表述填写）：
  // "light-warm": "明度浅、艳度中高、冷暖暖；适合浅淡明亮暖调；避讳深暗冷调。",
};

export const STYLE_LOGIC: Record<string, string> = {
  // 格式示例（请按本体系专业表述填写）：
  // "girl": "面料__、剪裁__、图案__；整体__。",
};

/** 判定方法论（用户定义的判定轴，喂给大模型作为判定框架） */
export const JUDGE_METHOD = `【判定方法（务必按此执行）】
1) 色彩季型怎么判：看商品整体颜色的「明度（深/浅）+ 艳度（净/浊）+ 冷暖（暖/冷）」三轴整体呈现的色相特征，对照各季型属性，不要只看色相名称。三轴综合后才定季型，可多选（1-4 个）。
2) 人物穿衣风格怎么判：看衣服「面料 + 剪裁 + 图案」这三者整体呈现的特点，判定曲线型/直线型、版型大小、以及偏风格方向（曲偏直/曲偏曲/直偏曲/直偏直）。`;

type SeasonIn = { code: string; name_zh: string; attributes?: string[] };
type StyleIn = {
  code: string;
  name_zh: string;
  gender?: string;
  type?: string | null;
  frame?: string | null;
  direction?: string | null;
};

/** 把知识库编译成喂给大模型的文本块（结构信息取自用户定义的表，不混入外行词） */
export function cmbKnowledgeText(seasons: SeasonIn[], styles: StyleIn[]): string {
  const seasonLines = seasons
    .map((s) => {
      const attr = (s.attributes && s.attributes.length ? s.attributes.join("/") : "（属性待补）");
      const logic = SEASON_LOGIC[s.code];
      return `- ${s.code} ${s.name_zh}［属性：${attr}］${logic ? "：" + logic : "：（穿搭逻辑待补充）"}`;
    })
    .join("\n");

  const styleLines = styles
    .map((s) => {
      const struct = [s.type, s.frame, s.direction].filter(Boolean).join("/");
      const logic = STYLE_LOGIC[s.code];
      return `- ${s.code} ${s.name_zh}［${s.gender === "men" ? "男" : "女"}${struct ? "·" + struct : ""}］${logic ? "：" + logic : "：（穿搭逻辑待补充）"}`;
    })
    .join("\n");

  return `${JUDGE_METHOD}\n\n【色彩季型判定知识库（12）】\n${seasonLines}\n\n【穿衣风格判定知识库】\n${styleLines}`;
}
