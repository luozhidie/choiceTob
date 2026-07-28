import LegalPage from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="隐私政策"
      updateDate="2026年7月28日"
      footer={
        <>
          <p>骆芷蝶智选 · 泉州鲤城服装批发</p>
          <p>客服微信：luozhidie666</p>
        </>
      }
    >
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">一、引言</h2>
        <p>
          骆芷蝶智选（以下简称"我们"或"平台"）高度重视您的个人信息保护。本隐私政策旨在向您说明我们如何收集、使用、存储、共享和保护您的个人信息，以及您享有的相关权利。请您在使用本平台服务前仔细阅读并充分理解本政策。如您不同意本政策的任何内容，请立即停止使用本平台服务。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">二、我们如何收集您的个人信息</h2>
        <p className="mb-2">您使用本平台服务时，我们可能会收集以下类型的信息：</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>账户信息</strong>：手机号、邮箱、昵称、头像、登录密码等，用于创建和管理您的平台账户。
          </li>
          <li>
            <strong>身份与经营信息</strong>：店铺名称、经营品类、月销售额、常拿风格、收货地址等，用于认证店主评估及提供更精准的选品推荐。
          </li>
          <li>
            <strong>色彩与风格数据</strong>：您在色彩季型测试、风格测试中提交的照片、问卷答案及分析结果，用于生成个性化穿搭与拿货建议。
          </li>
          <li>
            <strong>交易信息</strong>：订单记录、支付信息、会员购买记录、退换货记录等，用于订单履约与售后服务。
          </li>
          <li>
            <strong>行为与设备信息</strong>：浏览记录、搜索关键词、收藏/心愿单、设备型号、IP 地址、浏览器类型等，用于优化产品体验与保障账户安全。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">三、我们如何使用您的个人信息</h2>
        <p className="mb-2">我们严格在合法、正当、必要的范围内使用您的信息，具体用途包括：</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>完成账户注册、登录、实名认证及店主认证；</li>
          <li>为您提供商品展示、批发价查看、下单支付、物流跟踪等服务；</li>
          <li>基于您的色彩季型、风格偏好、历史拿货数据生成个性化推荐与搭配方案；</li>
          <li>处理心愿单聚合数据，帮助供应商量化生产与备货；</li>
          <li>向您发送订单状态、物流通知、服务提醒及经您同意的营销活动信息；</li>
          <li>进行数据分析、风控审核、反欺诈及平台安全保障；</li>
          <li>遵守法律法规、监管要求及平台规则执行。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">四、Cookie 与同类技术</h2>
        <p>
          为确保平台正常运行、记住您的偏好设置并提升用户体验，我们可能会使用 Cookie 或类似技术。您可以根据浏览器设置选择拒绝部分 Cookie，但可能导致部分功能无法正常使用。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">五、信息的共享、转让与公开披露</h2>
        <p className="mb-2">
          我们不会将您的个人信息出售给任何第三方。仅在以下情形中，我们可能会共享、转让或披露您的信息：
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>获得您的明确同意</strong>：例如您主动选择将个人信息授权给合作服务商。
          </li>
          <li>
            <strong>为完成交易与服务</strong>：向物流公司共享收货人姓名、电话、地址以完成配送；向支付机构共享必要的交易信息以完成支付。
          </li>
          <li>
            <strong>法定情形</strong>：根据法律法规、司法机关或行政机关依法提出的要求。
          </li>
          <li>
            <strong>权益保护</strong>：为保护平台、用户或公众的合法权益所必需。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">六、信息的存储与保护</h2>
        <p className="mb-2">
          我们采取符合业界标准的安全防护措施保护您的个人信息，包括但不限于 SSL 加密传输、数据脱敏、访问权限控制、定期安全审计等。我们仅会在实现本政策所述目的所需的期限内保留您的个人信息，法律法规另有规定的除外。
        </p>
        <p>
          请注意，互联网环境并非绝对安全。如您发现账户异常，请立即联系客服处理。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">七、您的权利</h2>
        <p className="mb-2">按照相关法律法规，您对个人信息享有以下权利：</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>访问、更正、删除您的个人信息；</li>
          <li>撤回同意或注销账户；</li>
          <li>限制或拒绝某些信息处理活动；</li>
          <li>获取您的个人信息副本（在技术可行的前提下）。</li>
        </ul>
        <p className="mt-2">
          您可以通过平台设置或联系客服行使上述权利。注销账户后，我们将按照法律法规要求删除或匿名化您的信息。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">八、未成年人保护</h2>
        <p>
          本平台主要面向年满 18 周岁的成年经营者。我们不会主动收集未成年人的个人信息。如您发现未成年人向我们提供了个人信息，请立即联系我们，我们将尽快删除相关信息。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">九、政策更新</h2>
        <p>
          我们可能会根据法律法规变化或业务发展适时修订本隐私政策。修订后的政策将在平台显著位置公布，并在生效前通过公告或站内消息通知您。如您继续使用平台服务，视为您同意修订后的政策。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">十、联系我们</h2>
        <p>
          如您对本隐私政策有任何疑问、意见或投诉，请通过以下方式联系我们：
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>客服微信：luozhidie666</li>
          <li>联系邮箱：luozhidie@live.cn</li>
          <li>联系电话：13925997776（工作日 9:00-18:00）</li>
        </ul>
      </section>
    </LegalPage>
  );
}
