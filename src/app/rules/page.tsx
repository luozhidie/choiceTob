import LegalPage from "@/components/LegalPage";

export default function RulesPage() {
  return (
    <LegalPage
      title="平台规则"
      updateDate="2026年7月28日"
      footer={
        <>
          <p>骆芷蝶智选 · 共建诚信批发环境</p>
          <p>客服微信：luozhidie666</p>
        </>
      }
    >
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">一、总则</h2>
        <p>
          为维护骆芷蝶智选平台（以下简称"平台"）公平、诚信、有序的交易环境，保障用户合法权益，根据国家相关法律法规及《平台服务协议》，制定本规则。本规则适用于所有访问、使用平台服务的用户。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">二、入驻与认证规则</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>用户注册时须填写真实有效的手机号/邮箱，禁止使用虚假身份。</li>
          <li>申请认证店主须如实填写店铺名称、经营品类、月销售额、常拿风格等信息，并通过平台认证评估。</li>
          <li>同一主体不得重复注册多个账户；平台有权对异常账户进行限制或清退。</li>
          <li>认证信息发生变更时，用户应在 30 日内完成更新，否则平台有权暂停店主权益。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">三、价格与交易规则</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>平台商品分为零售价与批发价。普通用户默认显示零售价；认证店主或开通对应会员后可查看批发价。</li>
          <li>商品价格以下单时页面展示为准，价格可能因活动、库存、批次等原因调整，已下单订单以订单确认价格为准。</li>
          <li>下单后请在规定时间内完成支付，超时未支付订单将自动关闭。</li>
          <li>心愿单模式商品仅用于需求收集，不参与即时交易，平台将根据聚合数据通知用户后续开售或量产信息。</li>
          <li>严禁用户以任何形式套取平台批发价、会员权益后转售牟利，一经发现将取消权益并追究责任。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">四、会员与权益规则</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>会员服务为虚拟服务，开通后不支持无理由退款，法律法规另有规定除外。</li>
          <li>会员权益仅限开通账户本人使用，不得转让、借用、共享账号。</li>
          <li>进阶 VIP、高阶 VIP 在会员价基础上享受对应折扣，具体以购买页面为准。</li>
          <li>连续 6 个月无拿货记录的认证店主，平台有权按规则降级部分权益。</li>
          <li>会员到期未续费，将自动恢复为普通用户，相关权益即时终止。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">五、内容发布与知识产权规则</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>用户上传的照片、评价、风格测试资料等内容，须保证拥有合法权利，不得侵犯他人肖像权、著作权、商标权等。</li>
          <li>禁止发布色情、暴力、赌博、政治敏感、虚假广告及其他违法违规内容。</li>
          <li>平台有权对涉嫌违规内容进行下架、删除或屏蔽处理，并保留追究法律责任的权利。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">六、退换货与售后规则</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>批发商品因属性特殊，非质量问题原则上不支持无理由退换，具体以商品详情页说明为准。</li>
          <li>如收到商品存在质量问题、错发、漏发，用户应在签收后 48 小时内联系客服并提供凭证。</li>
          <li>符合退换货条件的商品，用户应按平台指引退回，退货运费根据责任方判定承担。</li>
          <li>充值会员的退换额度按对应会员档位执行，超出额度部分由用户自行承担。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">七、禁止行为与违规处理</h2>
        <p className="mb-2">用户不得从事以下行为，否则平台有权采取警告、限制功能、封禁账户、追究法律责任等措施：</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>恶意注册、刷单、刷评、恶意投诉；</li>
          <li>利用平台漏洞、爬虫、脚本等不正当手段获取数据或利益；</li>
          <li>泄露、倒卖平台商品价格、供应商信息、用户信息等商业机密；</li>
          <li>冒充平台工作人员或认证店主进行诈骗；</li>
          <li>其他违反法律法规、公序良俗或平台规则的行为。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">八、规则更新与生效</h2>
        <p>
          平台有权根据业务发展及监管要求适时修订本规则，修订后的规则将在平台显著位置公示。如您继续使用平台服务，视为您同意修订后的规则。如您不同意，请停止使用。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">九、联系我们</h2>
        <p>如对平台规则有任何疑问或建议，请联系客服：</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>客服微信：luozhidie666</li>
          <li>联系邮箱：luozhidie@live.cn</li>
          <li>联系电话：13925997776（工作日 9:00-18:00）</li>
        </ul>
      </section>
    </LegalPage>
  );
}
