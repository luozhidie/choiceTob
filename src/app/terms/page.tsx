import LegalPage from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage
      title="平台服务协议"
      updateDate="2026年7月28日"
      footer={
        <>
          <p>骆芷蝶智选 · 泉州鲤城服装批发</p>
          <p>客服微信：luozhidie666</p>
        </>
      }
    >
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">一、定义与协议范围</h2>
        <p>
          本《平台服务协议》（以下简称"本协议"）由您（以下简称"用户"）与骆芷蝶智选平台运营方共同缔结。本协议适用于您访问、使用本平台（包括网页、微信小程序及相关服务）的全部行为。您勾选同意、点击确认或实际使用本平台服务，即视为您已阅读、理解并接受本协议所有条款。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">二、账户注册与使用</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>您须年满 18 周岁，具备完全民事行为能力，方可注册成为平台用户。</li>
          <li>您应提供真实、准确、完整的注册信息，并及时更新变更内容。</li>
          <li>您须妥善保管账户密码、验证码等安全信息，对账户下的所有行为独立承担法律责任。</li>
          <li>如发现账户被盗用或存在异常，应立即通知平台。因您保管不善导致的损失，由您自行承担。</li>
          <li>平台有权基于安全、合规或违反本协议等理由，暂停、限制或终止您的账户使用。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">三、平台服务内容与规则</h2>
        <p className="mb-2">骆芷蝶智选为用户提供以下服务：</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>服装批发商品浏览、搜索、收藏与心愿单收集；</li>
          <li>认证店主身份审核、批发价查看与拿货下单；</li>
          <li>会员订阅服务（月度/年度会员、进阶 VIP、高阶 VIP 等）；</li>
          <li>色彩季型测试、个人风格诊断、AI 搭配与商品企划等增值服务；</li>
          <li>订单管理、物流跟踪、售后服务及客户支持。</li>
        </ul>
        <p className="mt-2">
          平台保留根据业务发展调整、中断或新增部分服务的权利，并会尽可能提前公告。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">四、商品信息与交易</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>平台商品信息由供应商或平台运营方提供，可能存在细微色差、尺码误差，请以实物为准。</li>
          <li>普通用户仅可查看零售价；完成认证店主或开通对应会员后，可查看批发价。</li>
          <li>下单即视为您同意该商品的描述、价格、库存、发货及售后规则。</li>
          <li>心愿单模式商品暂无零售价，平台通过收集用户心愿数据帮助供应商量化生产，不构成即时购买要约。</li>
          <li>交易争议应优先通过平台客服协商解决；协商不成的，按本协议第十条规定处理。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">五、会员服务与费用</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>平台提供月度会员（¥999/月）、年度会员（¥11,980/年）等不同档位会员服务，具体权益以购买页面公示为准。</li>
          <li>进阶 VIP、高阶 VIP 在对应会员价基础上享受折扣，具体折扣以页面展示为准。</li>
          <li>会员服务为虚拟服务，一经开通，除法律法规另有规定外，不支持无理由退款。</li>
          <li>平台有权调整会员价格与权益，调整前将通过公告或站内消息提前通知。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">六、认证店主服务</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>用户可通过答题认证等方式申请成为认证店主，认证通过后可查看批发价、享受店主专属权益。</li>
          <li>认证店主应确保提交的经营信息真实有效，平台有权进行复核。</li>
          <li>认证店主身份不得转让、出租或借用，如发现违规，平台有权取消认证资格。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">七、知识产权</h2>
        <p className="mb-2">
          平台所有文字、图片、标识、界面设计、软件代码、数据汇编、测试题库等内容的知识产权归平台或相关权利人所有。未经平台书面许可，任何单位和个人不得擅自复制、传播、修改、反向工程或用于商业目的。
        </p>
        <p>
          用户上传至平台的内容，其知识产权归用户所有；用户授予平台在提供服务和宣传推广过程中免费、非独家的使用权。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">八、用户行为规范</h2>
        <p className="mb-2">用户在使用本平台时不得从事以下行为：</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>发布或传播违法违规、虚假欺诈、侵犯他人权益的信息；</li>
          <li>恶意刷单、恶意退款、恶意投诉或其他扰乱平台秩序的行为；</li>
          <li>利用技术手段攻击平台、窃取数据、绕过安全限制或进行爬虫；</li>
          <li>冒用他人身份、伪造认证材料或从事不正当竞争；</li>
          <li>将平台提供的价格、货源等商业信息泄露给第三方谋取私利。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">九、责任限制与免责</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>平台按"现状"和"可得到"的状态提供服务，不保证服务绝对无中断、无延误、无错误。</li>
          <li>因不可抗力、第三方原因、设备故障、网络中断等非平台过错导致的损失，平台不承担责任。</li>
          <li>平台不对供应商提供的商品质量、知识产权瑕疵、发货时效等承担直接责任，但将协助用户处理争议。</li>
          <li>在任何情况下，平台对用户的间接损失、预期利益损失不承担赔偿责任。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">十、协议变更、终止与争议解决</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>平台有权根据法律法规变化或业务发展修改本协议，修改后的协议在平台公示后生效。</li>
          <li>如您不同意修改后的协议，应停止使用平台服务；继续使用视为接受修改。</li>
          <li>您可随时申请注销账户，平台将在核实后按法律法规要求处理。</li>
          <li>本协议适用中华人民共和国法律。因本协议引起的争议，双方应友好协商；协商不成的，提交平台运营方所在地有管辖权的人民法院诉讼解决。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">十一、联系我们</h2>
        <p>如您对本协议有任何疑问，请通过以下方式联系我们：</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>客服微信：luozhidie666</li>
          <li>联系邮箱：luozhidie@live.cn</li>
          <li>联系电话：13925997776（工作日 9:00-18:00）</li>
        </ul>
      </section>
    </LegalPage>
  );
}
