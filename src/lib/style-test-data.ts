// 风格测试数据

// ==================== 类型定义 ====================

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
}

export interface StyleResult {
  name: string;
  desc: string;
  tags: string[];
}

export interface MaleScoreMap {
  vol: number;
  cur: number;
  special?: string;
}

export interface FemaleScoreEntry {
  [styleName: string]: number;
}

export interface MaleScoringLogic {
  questionScores: Record<string, Record<string, MaleScoreMap>>;
  preferenceMap: Record<string, string>;
  rules: {
    volumeThresholdHigh: number;
    volumeThresholdLow: number;
    curveThresholdHigh: number;
    curveThresholdLow: number;
    baseWeight: number;
  };
}

export interface FemaleScoringLogic {
  questionScores: Record<string, Record<string, FemaleScoreEntry>>;
}

export interface MaleTestConfig {
  preferenceQuestion: Question;
  questions: Question[];
  scoringLogic: MaleScoringLogic;
  results: StyleResult[];
}

export interface FemaleTestConfig {
  questions: Question[];
  scoringLogic: FemaleScoringLogic;
  results: StyleResult[];
}

// ==================== 男士风格测试数据 ====================

export const malePreferenceQuestion: Question = {
  id: 'preference',
  text: '你喜欢的衣着类型',
  options: [
    { value: 'A', label: '华丽张扬的' },
    { value: 'B', label: '潇洒自然的' },
    { value: 'C', label: '上品高档的' },
    { value: 'D', label: '优雅精美的' },
    { value: 'E', label: '个性时尚的' },
  ],
};

export const maleQuestions: Question[] = [
  {
    id: 'q1',
    text: '你的视觉身高看起来比实际身高',
    options: [
      { value: 'A', label: '显高' },
      { value: 'B', label: '显矮' },
      { value: 'C', label: '不显高也不显矮' },
    ],
  },
  {
    id: 'q2',
    text: '你是否有擅长的运动项目',
    options: [
      { value: 'A', label: '有' },
      { value: 'B', label: '没有' },
    ],
  },
  {
    id: 'q3',
    text: '你穿正装好看还是运动休闲装好看',
    options: [
      { value: 'A', label: '正装' },
      { value: 'B', label: '运动休闲装' },
      { value: 'C', label: '没区别都好看' },
    ],
  },
  {
    id: 'q4',
    text: '你青春年少的时候是否看起来比同龄人显老显成熟',
    options: [
      { value: 'A', label: '是' },
      { value: 'B', label: '否' },
    ],
  },
  {
    id: 'q5',
    text: '你穿的衣服面料品质感好你就好看',
    options: [
      { value: 'A', label: '有' },
      { value: 'B', label: '没有' },
    ],
  },
  {
    id: 'q6',
    text: '你穿西装紧身合体宽松哪个好看',
    options: [
      { value: 'A', label: '合体' },
      { value: 'B', label: '宽松' },
      { value: 'C', label: '紧身' },
    ],
  },
  {
    id: 'q7',
    text: '你穿西装单排扣还是双排扣好看',
    options: [
      { value: 'A', label: '单排' },
      { value: 'B', label: '双排' },
    ],
  },
  {
    id: 'q8',
    text: '如果是单排扣西装',
    options: [
      { value: 'A', label: '单排三粒扣' },
      { value: 'B', label: '单排四粒扣' },
    ],
  },
  {
    id: 'q9',
    text: '你穿西装敞开还是扣上好看',
    options: [
      { value: 'A', label: '扣上好看' },
      { value: 'B', label: '敞开好看' },
      { value: 'C', label: '没区别' },
    ],
  },
  {
    id: 'q10',
    text: '你穿衬衫平滑还是有肌理好看',
    options: [
      { value: 'A', label: '平滑的好看' },
      { value: 'B', label: '有肌理的好看' },
    ],
  },
  {
    id: 'q11',
    text: '你穿有图案还是没图案好看',
    options: [
      { value: 'A', label: '没图案的好看' },
      { value: 'B', label: '有图案的好看' },
      { value: 'C', label: '都差不多' },
    ],
  },
  {
    id: 'q12',
    text: '你穿衣服的图案哪种好看',
    options: [
      { value: 'A', label: '宽大条纹大格子' },
      { value: 'B', label: '窄小条纹小格子' },
      { value: 'C', label: '花朵图案' },
      { value: 'D', label: '素色比有图案的好看' },
    ],
  },
  {
    id: 'q13',
    text: '图案眼镜手表等大小哪种好看',
    options: [
      { value: 'A', label: '很大的好看' },
      { value: 'B', label: '中等的不夸张也不小气' },
      { value: 'C', label: '中等或小一点的好看' },
    ],
  },
  {
    id: 'q14',
    text: '你的皮鞋哪种款式好看',
    options: [
      { value: 'A', label: '一脚蹬的款式' },
      { value: 'B', label: '系带的款式' },
    ],
  },
  {
    id: 'q15',
    text: '皮鞋材质哪种好看',
    options: [
      { value: 'A', label: '磨砂皮' },
      { value: 'B', label: '漆皮' },
      { value: 'C', label: '细腻精良的皮质' },
      { value: 'D', label: '都好看看款式' },
    ],
  },
  {
    id: 'q16',
    text: '皮鞋鞋头形状哪种好看',
    options: [
      { value: 'A', label: '大长的尖头' },
      { value: 'B', label: '窄小的尖头' },
      { value: 'C', label: '圆头' },
      { value: 'D', label: '不尖也不圆' },
    ],
  },
  {
    id: 'q17',
    text: '你是否很有才情且异性缘很好',
    options: [
      { value: 'A', label: '是' },
      { value: 'B', label: '否' },
    ],
  },
  {
    id: 'q18',
    text: '你适合的发型',
    options: [
      { value: 'A', label: '有气势的背头' },
      { value: 'B', label: '平头寸头松散随意' },
      { value: 'C', label: '标准三七分一丝不苟' },
      { value: 'D', label: '可以很百变各种烫染' },
      { value: 'E', label: '柔和的发型长发' },
    ],
  },
];

export const maleScoringLogic: MaleScoringLogic = {
  questionScores: {
    q1: {
      A: { vol: 1, cur: 0 },
      B: { vol: -1, cur: 0 },
      C: { vol: 0, cur: 0 },
    },
    q2: {
      A: { vol: 0, cur: -1 },
      B: { vol: 0, cur: 1 },
    },
    q3: {
      A: { vol: 1, cur: 1 },
      B: { vol: -1, cur: -1 },
      C: { vol: 0, cur: 0 },
    },
    q4: {
      A: { vol: 1, cur: 0 },
      B: { vol: 0, cur: 0 },
    },
    q5: {
      A: { vol: 0, cur: 0, special: 'C' },
      B: { vol: 0, cur: 0 },
    },
    q6: {
      A: { vol: 0, cur: 0, special: 'C' },
      B: { vol: -1, cur: -1, special: 'B' },
      C: { vol: 0, cur: -1, special: 'E' },
    },
    q7: {
      A: { vol: -1, cur: 0 },
      B: { vol: 1, cur: 0 },
    },
    q8: {
      A: { vol: 0, cur: 0 },
      B: { vol: -1, cur: 0 },
    },
    q9: {
      A: { vol: 1, cur: 1 },
      B: { vol: -1, cur: 0 },
      C: { vol: 0, cur: 0 },
    },
    q10: {
      A: { vol: 0, cur: 1 },
      B: { vol: 0, cur: -1 },
    },
    q11: {
      A: { vol: 0, cur: 1 },
      B: { vol: 0, cur: -1 },
      C: { vol: 0, cur: 0 },
    },
    q12: {
      A: { vol: 1, cur: 0 },
      B: { vol: -1, cur: 0 },
      C: { vol: 0, cur: -1, special: 'D' },
      D: { vol: 0, cur: 1, special: 'C' },
    },
    q13: {
      A: { vol: 1, cur: 0 },
      B: { vol: 0, cur: 0 },
      C: { vol: -1, cur: 0 },
    },
    q14: {
      A: { vol: -1, cur: -1 },
      B: { vol: 1, cur: 1 },
    },
    q15: {
      A: { vol: 0, cur: -1, special: 'B' },
      B: { vol: 1, cur: 0, special: 'A' },
      C: { vol: 0, cur: 1, special: 'C' },
      D: { vol: 0, cur: 0, special: 'E' },
    },
    q16: {
      A: { vol: 1, cur: 0, special: 'A' },
      B: { vol: -1, cur: 0, special: 'E' },
      C: { vol: 0, cur: -1, special: 'B' },
      D: { vol: 0, cur: 1, special: 'C' },
    },
    q17: {
      A: { vol: 0, cur: -1, special: 'D' },
      B: { vol: 0, cur: 0 },
    },
    q18: {
      A: { vol: 1, cur: 1, special: 'A' },
      B: { vol: 0, cur: -1, special: 'B' },
      C: { vol: 0, cur: 1, special: 'C' },
      D: { vol: 0, cur: -1, special: 'E' },
      E: { vol: 0, cur: -1, special: 'D' },
    },
  },
  preferenceMap: {
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    E: 'E',
  },
  rules: {
    volumeThresholdHigh: 3,
    volumeThresholdLow: -3,
    curveThresholdHigh: 1,
    curveThresholdLow: -2,
    baseWeight: 3,
  },
};

export const maleResults: StyleResult[] = [
  {
    name: '戏剧型',
    desc: '气场强大、存在感强、视觉冲击、夸张大气',
    tags: ['气场强大', '存在感强', '视觉冲击', '夸张大气'],
  },
  {
    name: '自然型',
    desc: '潇洒随性、亲和自然、宽松舒适、不刻意打扮',
    tags: ['潇洒随性', '亲和自然', '宽松舒适', '不刻意打扮'],
  },
  {
    name: '古典型',
    desc: '高级感、品质至上、端庄正统、精致合体',
    tags: ['高级感', '品质至上', '端庄正统', '精致合体'],
  },
  {
    name: '浪漫型',
    desc: '优雅精美、才情出众、异性缘好、细腻高级',
    tags: ['优雅精美', '才情出众', '异性缘好', '细腻高级'],
  },
  {
    name: '时尚型',
    desc: '个性前卫、潮流时尚、百变造型、独特新颖',
    tags: ['个性前卫', '潮流时尚', '百变造型', '独特新颖'],
  },
];

// ==================== 女士风格测试数据 ====================

export const femaleQuestions: Question[] = [
  {
    id: 'q1',
    text: '你的视觉身高看起来比实际身高',
    options: [
      { value: 'A', label: '显高' },
      { value: 'B', label: '显矮' },
      { value: 'C', label: '不显高也不显矮' },
    ],
  },
  {
    id: 'q2',
    text: '你是否有擅长的运动项目',
    options: [
      { value: 'A', label: '有' },
      { value: 'B', label: '没有' },
    ],
  },
  {
    id: 'q3',
    text: '你穿正装好看还是运动休闲装好看',
    options: [
      { value: 'A', label: '正装' },
      { value: 'B', label: '运动休闲装' },
      { value: 'C', label: '都差不多' },
    ],
  },
  {
    id: 'q4',
    text: '你的身形是',
    options: [
      { value: 'A', label: '平肩扁腰' },
      { value: 'B', label: '溜肩圆腰' },
      { value: 'C', label: '好像区别不大' },
    ],
  },
  {
    id: 'q5',
    text: '你穿的衣服面料品质感好你就好看',
    options: [
      { value: 'A', label: '有' },
      { value: 'B', label: '没有' },
    ],
  },
  {
    id: 'q6',
    text: '你穿裤装好看还是裙装好看',
    options: [
      { value: 'A', label: '裤装' },
      { value: 'B', label: '裙装' },
      { value: 'C', label: '没区别' },
    ],
  },
  {
    id: 'q7',
    text: '你穿连衣裙好看还是上下分开的半裙好看',
    options: [
      { value: 'A', label: '连衣裙' },
      { value: 'B', label: '分开的裙装' },
      { value: 'C', label: '没区别' },
    ],
  },
  {
    id: 'q8',
    text: '你穿上衣的长度到哪个位置好看',
    options: [
      { value: 'A', label: '到臀部大腿根的长款' },
      { value: 'B', label: '到胯的中款' },
      { value: 'C', label: '到腰的短款' },
      { value: 'D', label: '都差不多' },
      { value: 'E', label: '要么长款要么短款中款不好看' },
    ],
  },
  {
    id: 'q9',
    text: '你小时候是否像男孩子一样淘气调皮',
    options: [
      { value: 'A', label: '是' },
      { value: 'B', label: '否' },
    ],
  },
  {
    id: 'q10',
    text: '你穿衣服敞开扣子好看还是扣上好看',
    options: [
      { value: 'A', label: '敞开好看' },
      { value: 'B', label: '扣上好看' },
    ],
  },
  {
    id: 'q11',
    text: '你青春年少时是否看起来比同龄人显老显成熟',
    options: [
      { value: 'A', label: '是' },
      { value: 'B', label: '否' },
    ],
  },
  {
    id: 'q12',
    text: '你青春期时身形发育是否比同龄人早',
    options: [
      { value: 'A', label: '是' },
      { value: 'B', label: '否' },
    ],
  },
  {
    id: 'q13',
    text: '你是否一直看起来都比同龄人显小',
    options: [
      { value: 'A', label: '是' },
      { value: 'B', label: '否' },
    ],
  },
  {
    id: 'q14',
    text: '你是否长着一张娃娃脸',
    options: [
      { value: 'A', label: '是' },
      { value: 'B', label: '否' },
    ],
  },
];

export const femaleScoringLogic: FemaleScoringLogic = {
  questionScores: {
    q1: {
      A: { 戏剧: 2, 前卫: 1 },
      B: { 少女: 2, 少年: 1 },
      C: { 自然: 1 },
    },
    q2: {
      A: { 少年: 2, 自然: 1 },
      B: { 优雅: 1, 浪漫: 1 },
    },
    q3: {
      A: { 古典: 2, 戏剧: 1 },
      B: { 少年: 2, 自然: 1 },
      C: { 优雅: 1, 前卫: 1 },
    },
    q4: {
      A: { 少年: 2, 戏剧: 1 },
      B: { 浪漫: 2, 优雅: 1 },
      C: { 自然: 1 },
    },
    q5: {
      A: { 古典: 2, 戏剧: 1 },
      B: { 少女: 1, 自然: 1 },
    },
    q6: {
      A: { 少年: 2, 戏剧: 1 },
      B: { 浪漫: 2, 优雅: 1 },
      C: { 自然: 1 },
    },
    q7: {
      A: { 浪漫: 2, 优雅: 1 },
      B: { 少年: 2, 前卫: 1 },
      C: { 自然: 1 },
    },
    q8: {
      A: { 戏剧: 2, 浪漫: 1 },
      B: { 古典: 1, 自然: 1 },
      C: { 少年: 2, 前卫: 1 },
      D: { 自然: 1 },
      E: { 前卫: 1, 戏剧: 1 },
    },
    q9: {
      A: { 少年: 2, 前卫: 1 },
      B: { 优雅: 1, 浪漫: 1 },
    },
    q10: {
      A: { 戏剧: 2, 前卫: 1 },
      B: { 古典: 2, 优雅: 1 },
    },
    q11: {
      A: { 古典: 2, 戏剧: 1 },
      B: { 少女: 1, 少年: 1 },
    },
    q12: {
      A: { 浪漫: 2, 优雅: 1 },
      B: { 少女: 1, 少年: 1 },
    },
    q13: {
      A: { 少女: 2, 少年: 1 },
      B: { 古典: 1, 戏剧: 1 },
    },
    q14: {
      A: { 少女: 3 },
      B: { 优雅: 1, 浪漫: 1 },
    },
  },
};

export const femaleResults: StyleResult[] = [
  {
    name: '少女型',
    desc: '可爱甜美、青春活泼、小巧灵动、乖巧精致',
    tags: ['可爱甜美', '青春活泼', '小巧灵动', '乖巧精致'],
  },
  {
    name: '少年型',
    desc: '帅气利落、中性干练、清爽活泼、简洁大方',
    tags: ['帅气利落', '中性干练', '清爽活泼', '简洁大方'],
  },
  {
    name: '优雅型',
    desc: '温柔知性、气质出众、柔美含蓄、温婉大方',
    tags: ['温柔知性', '气质出众', '柔美含蓄', '温婉大方'],
  },
  {
    name: '浪漫型',
    desc: '华丽妩媚、曲线玲珑、成熟迷人、风情万种',
    tags: ['华丽妩媚', '曲线玲珑', '成熟迷人', '风情万种'],
  },
  {
    name: '戏剧型',
    desc: '气场强大、存在感强、视觉冲击、夸张大气',
    tags: ['气场强大', '存在感强', '视觉冲击', '夸张大气'],
  },
  {
    name: '古典型',
    desc: '高级端庄、品质至上、正统得体、精致合体',
    tags: ['高级端庄', '品质至上', '正统得体', '精致合体'],
  },
  {
    name: '自然型',
    desc: '潇洒随性、亲和自然、宽松舒适、不刻意打扮',
    tags: ['潇洒随性', '亲和自然', '宽松舒适', '不刻意打扮'],
  },
  {
    name: '前卫型',
    desc: '个性独特、潮流时尚、百变造型、打破常规',
    tags: ['个性独特', '潮流时尚', '百变造型', '打破常规'],
  },
];

// ==================== 组合配置 ====================

export const maleTestConfig: MaleTestConfig = {
  preferenceQuestion: malePreferenceQuestion,
  questions: maleQuestions,
  scoringLogic: maleScoringLogic,
  results: maleResults,
};

export const femaleTestConfig: FemaleTestConfig = {
  questions: femaleQuestions,
  scoringLogic: femaleScoringLogic,
  results: femaleResults,
};

// ==================== 用户端市场术语映射 ====================

/**
 * 女士专业风格名 → 用户端市场名
 * 用户端展示市场名，后台保留专业名
 */
export const FEMALE_STYLE_MARKET_MAP: Record<string, string> = {
  '少女型': '甜美少女',
  '少年型': '简约通勤',
  '优雅型': '法式优雅',
  '浪漫型': '浪漫女神',
  '戏剧型': '气场女王',
  '古典型': '轻奢极简',
  '自然型': '日系文艺',
  '前卫型': '街头潮牌',
};

/**
 * 男士专业风格名 → 用户端市场名
 */
export const MALE_STYLE_MARKET_MAP: Record<string, string> = {
  '戏剧型': '气场型男',
  '自然型': '随性达人',
  '古典型': '精英绅士',
  '浪漫型': '优雅先生',
  '时尚型': '潮流先锋',
};

/**
 * 将专业风格名转换为用户端市场名
 */
export function getMarketStyleName(professionalName: string, gender: 'male' | 'female'): string {
  const map = gender === 'female' ? FEMALE_STYLE_MARKET_MAP : MALE_STYLE_MARKET_MAP;
  return map[professionalName] || professionalName;
}

// ==================== 计算函数 ====================

const MALE_STYLE_KEYS = ['A', 'B', 'C', 'D', 'E'] as const;

/**
 * 计算男士风格测试结果
 * @param answers 正式题目答案 { q1: 'A', q2: 'B', ... }
 * @param preference 喜好题答案 'A' | 'B' | 'C' | 'D' | 'E'
 * @returns 风格名称
 */
export function calculateMaleResult(
  answers: Record<string, string>,
  preference: string,
): string {
  const { questionScores, rules } = maleScoringLogic;

  // 1. 计算量感和直曲总分
  let volumeScore = 0;
  let curveScore = 0;

  // 特殊指向分
  const specialScores: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  for (const qId of Object.keys(questionScores)) {
    const answer = answers[qId];
    if (!answer) continue;
    const scoreMap = questionScores[qId][answer];
    if (!scoreMap) continue;

    volumeScore += scoreMap.vol;
    curveScore += scoreMap.cur;

    if (scoreMap.special) {
      specialScores[scoreMap.special] += 1;
    }
  }

  // 2. 根据量感+直曲确定基础风格（+3分加权）
  const { volumeThresholdHigh, volumeThresholdLow, curveThresholdHigh, curveThresholdLow, baseWeight } = rules;

  if (volumeScore >= volumeThresholdHigh) {
    if (curveScore >= curveThresholdHigh) {
      specialScores['A'] += baseWeight;
    } else if (curveScore <= curveThresholdLow) {
      specialScores['D'] += baseWeight;
    } else {
      specialScores['A'] += baseWeight;
    }
  } else if (volumeScore <= volumeThresholdLow) {
    if (curveScore >= curveThresholdHigh) {
      specialScores['C'] += baseWeight;
    } else if (curveScore <= curveThresholdLow) {
      specialScores['E'] += baseWeight;
    } else {
      specialScores['E'] += baseWeight;
    }
  } else {
    // 中量感
    if (curveScore >= 2) {
      specialScores['C'] += baseWeight;
    } else if (curveScore <= curveThresholdLow) {
      specialScores['D'] += baseWeight;
    } else {
      specialScores['B'] += baseWeight;
    }
  }

  // 3. 加上喜好分
  if (preference && specialScores[preference] !== undefined) {
    specialScores[preference] += 2;
  }

  // 4. 找到最高分的风格
  let maxScore = -Infinity;
  let resultKey = 'B';

  for (const key of MALE_STYLE_KEYS) {
    if (specialScores[key] > maxScore) {
      maxScore = specialScores[key];
      resultKey = key;
    }
  }

  // 5. 映射到风格名称
  const keyToName: Record<string, string> = {
    A: '戏剧型',
    B: '自然型',
    C: '古典型',
    D: '浪漫型',
    E: '时尚型',
  };

  return keyToName[resultKey];
}

/**
 * 计算女士风格测试结果
 * @param answers 题目答案 { q1: 'A', q2: 'B', ... }
 * @returns 风格名称
 */
export function calculateFemaleResult(
  answers: Record<string, string>,
): string {
  const { questionScores } = femaleScoringLogic;

  // 累加各风格分数
  const styleScores: Record<string, number> = {
    少女: 0,
    少年: 0,
    优雅: 0,
    浪漫: 0,
    戏剧: 0,
    古典: 0,
    自然: 0,
    前卫: 0,
  };

  for (const qId of Object.keys(questionScores)) {
    const answer = answers[qId];
    if (!answer) continue;
    const scoreEntry = questionScores[qId][answer];
    if (!scoreEntry) continue;

    for (const [style, score] of Object.entries(scoreEntry)) {
      if (styleScores[style] !== undefined) {
        styleScores[style] += score;
      }
    }
  }

  // 找到最高分的风格
  let maxScore = -Infinity;
  let resultStyle = '自然';

  for (const [style, score] of Object.entries(styleScores)) {
    if (score > maxScore) {
      maxScore = score;
      resultStyle = style;
    }
  }

  return resultStyle + '型';
}
