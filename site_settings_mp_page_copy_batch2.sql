-- 批次2：小程序文案后台化（代理招募 / 代理小店 / 店主认证）
-- 追加 agent / certify 两段到已存在的 mp_page_copy（批次1已 INSERT）
-- 用 jsonb_set 按子路径追加，不覆盖已有 member/newcustomer/tryon
-- 在 Supabase Dashboard → SQL Editor 逐块粘贴执行（共 9 块）

-- [1/9 agent.recruit]
update site_settings set value = jsonb_set(value, '{agent,recruit}', $json${"done":{"title":"提交成功","desc":"我们已收到你的代理申请，专属顾问会在 1-2 个工作日内联系你","btn":"返回首页"},"hero":{"badge":"JOIN AGENT","title":"成为销售代理","desc":"共享时尚产业红利，预存货款享会员价，邀好友再得返利"},"advantages":{"label":"ADVANTAGES","title":"权益优势","cards":[{"icon":"📈","title":"数据驱动","desc":"AI 选品 + 销售预测，降低压货风险"},{"icon":"🎨","title":"设计支持","desc":"专业设计团队，季度更新 300+ 款"},{"icon":"📦","title":"直采货源","desc":"广州/杭州直采，价格优势明显"},{"icon":"🎓","title":"培训体系","desc":"从零到专业买手的全链路培训"}]},"conditions":{"label":"CONDITIONS","title":"升级条件","items":["认同品牌理念，遵纪守法","有实体渠道或线上销售渠道","具备一定资金实力与抗风险能力","愿接受平台统一管理及培训","有良好商业信誉与服务意识"]},"apply":{"label":"APPLY NOW","title":"立即报名","submitText":"提交报名","submittingText":"提交中...","tip":"提交即表示同意我们与你联系，信息仅用于代理审核"}}$json$::jsonb) where key='mp_page_copy';

-- [2/9 agent.shop]
update site_settings set value = jsonb_set(value, '{agent,shop}', $json${"loading":"加载中…","empty":{"emoji":"🔗","title":"链接无效","desc":"链接不存在或未激活","btn":"回到首页"},"shopHead":{"badge":"专属精选店","nameSuffix":" 的精选店","desc":"先试再买 · 由专属买手为你服务"},"tryBar":{"emoji":"👗","title":"云衣橱 · AI 虚拟试衣","desc":"上传照片，先看上身效果再决定","btn":"去试衣 ›"},"product":{"buyBtn":"立即买","tryBtn":"试穿 ›"},"tip":"价格由店铺设定","paySheet":{"addrEmpty":"＋ 选择收货地址","payPrefix":"微信支付 ¥"}}$json$::jsonb) where key='mp_page_copy';

-- [3/9 certify.intro]
update site_settings set value = jsonb_set(value, '{certify,intro}', $json${"badge":"认证会员 · 开通会员价","title":"填写资料，即刻开通会员价查看权","benefitTitle":"认证后可享 4 大权益","benefits":[{"icon":"价","name":"会员价查看权","desc":"认证即可查看所有商品会员价"},{"icon":"退","name":"退换额度","desc":"充值后享阶梯退换额度"},{"icon":"新","name":"新款抢先看","desc":"当季新品提前浏览推荐"},{"icon":"荐","name":"精准推荐","desc":"基于店铺画像匹配款式"}],"btn":"开始填写 →"}$json$::jsonb) where key='mp_page_copy';

-- [4/9 certify.steps]
update site_settings set value = jsonb_set(value, '{certify,steps}', $json${"identity":"1/4 店铺基本信息","profile":"2/4 经营画像","extra":"3/4 补充信息"}$json$::jsonb) where key='mp_page_copy';

-- [5/9 certify.sections]
update site_settings set value = jsonb_set(value, '{certify,sections}', $json${"basic":{"icon":"🏪","title":"基本信息","hint":"*全项必填"},"market":{"icon":"🚛","title":"主要采购渠道","hint":"*至少选1个"},"freq":{"icon":"📅","title":"月均采购频次","hint":"*"},"category":{"icon":"👗","title":"主营品类","hint":"*至少选1个"},"style":{"icon":"🎨","title":"风格偏好","hint":"*至少选1个"},"target":{"icon":"👥💰","title":"目标客群","hint":"*"},"location":{"icon":"📍","title":"店铺位置","hint":"*"},"photos":{"icon":"📷","title":"店铺照片","hint":"*各1张"},"proof":{"icon":"🧾","title":"购物凭证","hint":"*"},"bizData":{"icon":"📊","title":"经营数据","hint":"选填"},"notes":{"icon":"📝","title":"备注 / 需求说明","hint":"选填"}}$json$::jsonb) where key='mp_page_copy';

-- [6/9 certify.photos]
update site_settings set value = jsonb_set(value, '{certify,photos}', $json${"frontTitle":"点击上传门头照","frontTip":"展示招牌/店招","frontLabel":"* 店铺门头照","interiorTitle":"点击上传陈列照","interiorTip":"展示店内陈列/货架","interiorLabel":"* 店内陈列照","proofTitle":"点击上传购物凭证","proofTip":"拍照或相册选取近期购物凭证","proofLabel":"* 上传购物凭证（必填）"}$json$::jsonb) where key='mp_page_copy';

-- [7/9 certify.btns]
update site_settings set value = jsonb_set(value, '{certify,btns}', $json${"nextIdentity":"下一步：经营画像 →","nextProfile":"下一步：补充信息 →","submit":"提交认证，开通会员价 🛡","submitting":"提交中...","goBuyer":"去看款选购","goMy":"前往个人中心"}$json$::jsonb) where key='mp_page_copy';

-- [8/9 certify.done]
update site_settings set value = jsonb_set(value, '{certify,done}', $json${"crown":"👑","tit":"认证成功！🎉","sub":"会员价已开启 · 信息已同步至后台","items":[{"b":"会员价已解锁","t":"全店商品可看会员价"},{"b":"退换额度","t":"开通充值会员后生效"},{"b":"新款抢先看","t":"当季新品提前推荐"},{"b":"精准款式推荐","t":"按店铺画像匹配"}]}$json$::jsonb) where key='mp_page_copy';

-- [9/9 certify.login]
update site_settings set value = jsonb_set(value, '{certify,login}', $json${"tit":"请先登录","dsc":"认证会员需先登录账号","btn":"去登录","back":"返回首页"}$json$::jsonb) where key='mp_page_copy';