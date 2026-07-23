/**
 * CMB 知识库（穿搭判定逻辑）
 * ───────────────────────────────────────────────────────────
 * 用途：喂给大模型，让它按「骆芷蝶体系」给商品判断色彩季型 + 风格。
 * 这里只放「结构性正确」的判定骨架（来自用户定义的 12 季型属性 / 风格 曲线·直线·版型·方向）。
 * 每个类型后面留了「穿搭逻辑：」位，由运营/买手按实际经验补充更细的
 * 领型、面料、代表单品、口诀等。补充后 AI 判断会更准。
 *
 * 修改方式：直接编辑下面 SEASON_LOGIC / STYLE_LOGIC 里对应 code 的文本即可，
 * 不需要改其它代码。code 与 color_seasons / style_tags 表里的 code 一一对应。
 */

export const SEASON_LOGIC: Record<string, string> = {
  "light-warm": "浅暖型（浅+亮+暖）。适合色：浅淡明亮的暖调，如米白、浅杏、鹅黄、珊瑚粉、浅橘；避讳：深暗冷调。",
  "light-cool": "浅冷型（浅+柔+冷）。适合色：浅淡柔和的冷调，如粉蓝、雾蓝、淡紫、灰粉、浅薄荷；避讳：浓重暖调。",
  "deep-warm": "深暖型（深+柔+暖）。适合色：深沉温暖的浊色，如巧克力、驼色、橄榄绿、砖红、暖棕；避讳：浅冷荧光。",
  "deep-cool": "深冷型（深+冷+净）。适合色：深而干净冷的纯色，如藏蓝、宝蓝、黑、玫红、冷红；避讳：浑浊暖浅。",
  "clear-warm": "净暖型（亮+浅+暖）。适合色：明亮纯净的暖色，如明黄、橘、鲜绿、暖白；避讳：灰浊。",
  "clear-cool": "净冷型（亮+深+冷）。适合色：明艳干净的冷色，如正蓝、紫红、翠绿、冷宝蓝；避讳：灰调。",
  "soft-warm": "柔暖型（柔+深+暖）。适合色：柔和温暖的浊色，如奶茶、卡其、暖灰、姜黄；避讳：高对比冷亮。",
  "soft-cool": "柔冷型（柔+浅+冷）。适合色：柔和偏冷的灰调，如灰蓝、雾紫、粉灰、雾绿；避讳：鲜艳暖色。",
  "warm-bright": "暖亮型（暖+浅+亮）。适合色：暖而明亮的色彩，如明橙、亮黄、暖白、浅金；避讳：深暗。",
  "warm-soft": "暖柔型（暖+柔+深）。适合色：温暖柔和的色彩，如驼色、杏色、暖棕、藕荷；避讳：冷硬。",
  "cool-bright": "冷亮型（冷+深+亮）。适合色：冷而明亮的色彩，如宝蓝、冷红、翠蓝、冷玫；避讳：灰暗暖调。",
  "cool-soft": "冷柔型（冷+浅+柔）。适合色：冷而柔和的色彩，如雾蓝、淡紫、冷灰、粉蓝；避讳：浓暖。",
};

export const STYLE_LOGIC: Record<string, string> = {
  // ─── 女士 主风格 ───
  girl: "少女型（曲线·小版型）。判定：圆润小量感、可爱柔和、年轻感。穿搭逻辑：宜圆领、A摆裙、碎花、荷叶边、泡泡袖、针织；避硬挺直线大廓形。",
  elegant: "优雅型（曲线·小版型）。判定：精致柔和、上品贵气、小量感曲线。穿搭逻辑：宜小量感曲线、真丝/丝绒、微收V领、合身；避夸张。",
  romantic: "浪漫型（曲线·大版型）。判定：女人味、大曲线、妩媚。穿搭逻辑：宜大裙摆、蕾丝、雪纺、曲线领、飘带；避中性硬朗。",
  boyish: "少年型（直线·小版型）。判定：帅气利落、少年感、直线。穿搭逻辑：宜直线剪裁、衬衫领、工装、H版、短款；避繁复曲线。",
  fashion: "时尚型（直线·小版型）。判定：个性前卫、流行感。穿搭逻辑：宜撞色、不对称、廓形感、流行元素；避正统保守。",
  classic: "古典型（直线·大版型）。判定：端庄规整、职业贵气。穿搭逻辑：宜对称直线、精纺羊毛、小翻领、合身套装；避随意。",
  natural: "自然型（直线·大版型）。判定：宽松舒适、质朴。穿搭逻辑：宜天然面料、直线宽松、中性色、无拘束；避精致拘谨。",
  dramatic: "戏剧型（直线·大版型）。判定：夸张大气、强对比。穿搭逻辑：宜大廓形、强对比、挺括面料、戏剧领、长款；避小气量。",
  // ─── 女士 偏风格（在母风格基础上叠加方向）───
  girl_qz_boyish: "少女偏少年（曲偏直）。少女的柔加少年的直线利落。",
  girl_qz_fashion: "少女偏时尚（曲偏直）。少女的柔加时尚的个性。",
  girl_qz_classic: "少女偏古典（曲偏直）。少女的柔加古典的规整。",
  girl_qz_natural: "少女偏自然（曲偏直）。少女的柔加自然的松弛。",
  girl_qz_dramatic: "少女偏戏剧（曲偏直）。少女的柔加戏剧的夸张。",
  girl_qq_elegant: "少女偏优雅（曲偏曲）。强化少女曲线 + 优雅精致。",
  girl_qq_romantic: "少女偏浪漫（曲偏曲）。强化少女曲线 + 浪漫妩媚。",
  elegant_qz_boyish: "优雅偏少年（曲偏直）。优雅加少年直线。",
  elegant_qz_fashion: "优雅偏时尚（曲偏直）。优雅加时尚个性。",
  elegant_qz_classic: "优雅偏古典（曲偏直）。优雅加古典规整。",
  elegant_qz_natural: "优雅偏自然（曲偏直）。优雅加自然松弛。",
  elegant_qz_dramatic: "优雅偏戏剧（曲偏直）。优雅加戏剧夸张。",
  elegant_qq_girl: "优雅偏少女（曲偏曲）。优雅加少女柔美。",
  elegant_qq_romantic: "优雅偏浪漫（曲偏曲）。优雅加浪漫妩媚。",
  romantic_qz_boyish: "浪漫偏少年（曲偏直）。浪漫加少年直线。",
  romantic_qz_fashion: "浪漫偏时尚（曲偏直）。浪漫加时尚个性。",
  romantic_qz_classic: "浪漫偏古典（曲偏直）。浪漫加古典规整。",
  romantic_qz_natural: "浪漫偏自然（曲偏直）。浪漫加自然松弛。",
  romantic_qz_dramatic: "浪漫偏戏剧（曲偏直）。浪漫加戏剧夸张。",
  romantic_qq_girl: "浪漫偏少女（曲偏曲）。浪漫加少女柔美。",
  romantic_qq_elegant: "浪漫偏优雅（曲偏曲）。浪漫加优雅精致。",
  boyish_zq_girl: "少年偏少女（直偏曲）。少年直线加少女柔美。",
  boyish_zq_elegant: "少年偏优雅（直偏曲）。少年直线加优雅精致。",
  boyish_zq_romantic: "少年偏浪漫（直偏曲）。少年直线加浪漫曲线。",
  boyish_zz_fashion: "少年偏时尚（直偏直）。少年加时尚的硬朗个性。",
  boyish_zz_classic: "少年偏古典（直偏直）。少年加古典规整。",
  boyish_zz_natural: "少年偏自然（直偏直）。少年加自然松弛。",
  boyish_zz_dramatic: "少年偏戏剧（直偏直）。少年加戏剧夸张。",
  fashion_zq_girl: "时尚偏少女（直偏曲）。时尚加少女柔美。",
  fashion_zq_elegant: "时尚偏优雅（直偏曲）。时尚加优雅精致。",
  fashion_zq_romantic: "时尚偏浪漫（直偏曲）。时尚加浪漫曲线。",
  fashion_zz_boyish: "时尚偏少年（直偏直）。时尚加少年硬朗。",
  fashion_zz_classic: "时尚偏古典（直偏直）。时尚加古典规整。",
  fashion_zz_natural: "时尚偏自然（直偏直）。时尚加自然松弛。",
  fashion_zz_dramatic: "时尚偏戏剧（直偏直）。时尚加戏剧夸张。",
  classic_zq_girl: "古典偏少女（直偏曲）。古典加少女柔美。",
  classic_zq_elegant: "古典偏优雅（直偏曲）。古典加优雅精致。",
  classic_zq_romantic: "古典偏浪漫（直偏曲）。古典加浪漫曲线。",
  classic_zz_boyish: "古典偏少年（直偏直）。古典加少年直线。",
  classic_zz_fashion: "古典偏时尚（直偏直）。古典加时尚个性。",
  classic_zz_natural: "古典偏自然（直偏直）。古典加自然松弛。",
  classic_zz_dramatic: "古典偏戏剧（直偏直）。古典加戏剧夸张。",
  natural_zq_girl: "自然偏少女（直偏曲）。自然加少女柔美。",
  natural_zq_elegant: "自然偏优雅（直偏曲）。自然加优雅精致。",
  natural_zq_romantic: "自然偏浪漫（直偏曲）。自然加浪漫曲线。",
  natural_zz_boyish: "自然偏少年（直偏直）。自然加少年直线。",
  natural_zz_fashion: "自然偏时尚（直偏直）。自然加时尚个性。",
  natural_zz_classic: "自然偏古典（直偏直）。自然加古典规整。",
  natural_zz_dramatic: "自然偏戏剧（直偏直）。自然加戏剧夸张。",
  dramatic_zq_girl: "戏剧偏少女（直偏曲）。戏剧加少女柔美。",
  dramatic_zq_elegant: "戏剧偏优雅（直偏曲）。戏剧加优雅精致。",
  dramatic_zq_romantic: "戏剧偏浪漫（直偏曲）。戏剧加浪漫曲线。",
  dramatic_zz_boyish: "戏剧偏少年（直偏直）。戏剧加少年直线。",
  dramatic_zz_fashion: "戏剧偏时尚（直偏直）。戏剧加时尚个性。",
  dramatic_zz_classic: "戏剧偏古典（直偏直）。戏剧加古典规整。",
  dramatic_zz_natural: "戏剧偏自然（直偏直）。戏剧加自然松弛。",
  // ─── 男士 主风格 ───
  dramatic_m: "戏剧型（男·大版型）。判定：大气、强对比、存在感强。穿搭逻辑：宜大廓形、挺括、强对比配色；避小气量。",
  natural_m: "自然型（男·大版型）。判定：宽松、质朴、舒适。穿搭逻辑：宜天然面料、直线宽松、中性；避精致拘谨。",
  classic_m: "古典型（男·中版型）。判定：端庄、规整、职业。穿搭逻辑：宜对称、精纺、合身西装/衬衫；避随意。",
  romantic_m: "浪漫型（男·中版型）。判定：儒雅、阴柔、有才情。穿搭逻辑：宜柔软面料、微曲线领、温柔色；避硬朗夸张。",
  fashion_m: "时尚型（男·小版型）。判定：个性、前卫、年轻。穿搭逻辑：宜撞色、廓形、流行元素；避正统。",
  // ─── 男士 偏风格 ───
  dramatic_m_natural: "戏剧偏自然（男）。戏剧大气加自然松弛。",
  dramatic_m_classic: "戏剧偏古典（男）。戏剧加古典规整。",
  dramatic_m_romantic: "戏剧偏浪漫（男）。戏剧加浪漫阴柔。",
  dramatic_m_fashion: "戏剧偏时尚（男）。戏剧加时尚个性。",
  natural_m_dramatic: "自然偏戏剧（男）。自然加戏剧夸张。",
  natural_m_classic: "自然偏古典（男）。自然加古典规整。",
  natural_m_romantic: "自然偏浪漫（男）。自然加浪漫阴柔。",
  natural_m_fashion: "自然偏时尚（男）。自然加时尚个性。",
  classic_m_dramatic: "古典偏戏剧（男）。古典加戏剧夸张。",
  classic_m_natural: "古典偏自然（男）。古典加自然松弛。",
  classic_m_romantic: "古典偏浪漫（男）。古典加浪漫阴柔。",
  classic_m_fashion: "古典偏时尚（男）。古典加时尚个性。",
  romantic_m_dramatic: "浪漫偏戏剧（男）。浪漫加戏剧夸张。",
  romantic_m_natural: "浪漫偏自然（男）。浪漫加自然松弛。",
  romantic_m_classic: "浪漫偏古典（男）。浪漫加古典规整。",
  romantic_m_fashion: "浪漫偏时尚（男）。浪漫加时尚个性。",
  fashion_m_dramatic: "时尚偏戏剧（男）。时尚加戏剧夸张。",
  fashion_m_natural: "时尚偏自然（男）。时尚加自然松弛。",
  fashion_m_classic: "时尚偏古典（男）。时尚加古典规整。",
  fashion_m_romantic: "时尚偏浪漫（男）。时尚加浪漫阴柔。",
};

/** 判定方法论（用户定义的判定轴，喂给大模型作为判定框架） */
export const JUDGE_METHOD = `【判定方法（务必按此执行）】
1) 色彩季型怎么判：看商品整体颜色的「明度（深/浅）+ 艳度（净/浊）+ 冷暖（暖/冷）」三轴整体呈现的色相特征，对照各季型属性（浅/深/暖/冷/亮/柔/净…），不要只看色相名称。三轴综合后才定季型，可多选（1-4 个）。
2) 人物穿衣风格怎么判：看衣服「面料（软硬、垂感、肌理）+ 剪裁（曲线/直线、量感大小、版型）+ 图案（有无、大小、曲直）」这三者整体呈现的特点，判定曲线型/直线型、版型大小、以及偏风格方向（曲偏直/曲偏曲/直偏曲/直偏直）。`;

/** 把知识库编译成喂给大模型的文本块 */
export function cmbKnowledgeText(seasons: { code: string; name_zh: string }[], styles: { code: string; name_zh: string }[]): string {
  const seasonLines = seasons
    .map((s) => {
      const logic = SEASON_LOGIC[s.code];
      return logic ? `- ${s.code} ${s.name_zh}：${logic}` : `- ${s.code} ${s.name_zh}`;
    })
    .join("\n");

  const styleLines = styles
    .map((s) => {
      const logic = STYLE_LOGIC[s.code];
      return logic ? `- ${s.code} ${s.name_zh}：${logic}` : `- ${s.code} ${s.name_zh}`;
    })
    .join("\n");

  return `${JUDGE_METHOD}\n\n【色彩季型判定知识库（12）】\n${seasonLines}\n\n【穿衣风格判定知识库】\n${styleLines}`;
}
