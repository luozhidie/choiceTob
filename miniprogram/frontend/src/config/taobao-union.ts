/**
 * 淘宝联盟开放平台 API 配置
 * 骆芷蝶教你变美 (AppKey: 35381810)
 * 骆芷蝶智选 (AppKey: 35379028)
 */
export const taobaoUnionConfig = {
  // 骆芷蝶教你变美
  app1: {
    name: '骆芷蝶教你变美',
    appKey: '35381810',
    appSecret: '7f39dbf8fa89f6a57410d912855297b1',
  },
  // 骆芷蝶智选
  app2: {
    name: '骆芷蝶智选',
    appKey: '35379028',
    appSecret: '6618b21641180bf27ffa6d71570b5fa9',
  },
}

// 默认使用 app2（骆芷蝶智选）
export const defaultUnionApp = taobaoUnionConfig.app2
