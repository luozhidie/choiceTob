import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-primary mb-8 inline-block"
        >
          &larr; 返回首页
        </Link>

        <h1 className="text-3xl font-bold text-primary mt-4 mb-2">服务条款</h1>
        <p className="text-sm text-muted-foreground mb-10">最后更新：2026年5月21日</p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">一、服务说明</h2>
            <p className="text-muted-foreground">
              骆芷蝶智选（以下简称"本平台"）是一个服装行业ToB供应链智选平台，为用户提供包括但不限于：
              买手选品、商品企划、陈列搭配、营销策划、VIP管理、教学培训等服务。
              使用本平台即表示您同意本服务条款的全部内容。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">二、账户注册与管理</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
              <li>您需提供真实、准确、完整的注册信息，并负责维护信息的及时更新</li>
              <li>您对账户下的所有活动负责，请妥善保管账户密码</li>
              <li>如发现未经授权使用您账户的情况，请立即通知我们</li>
              <li>我们有权在违反本条款的情况下暂停或终止您的账户</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">三、知识产权</h2>
            <p className="text-muted-foreground">
              本平台的所有内容，包括但不限于文字、图片、软件、界面设计、数据汇编等，
              均受知识产权法保护。未经我们书面许可，不得以任何形式复制、传播、修改或使用。
              用户上传的内容，其知识产权归用户所有，但用户授予本平台在平台范围内使用的许可。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">四、服务费用</h2>
            <p className="text-muted-foreground">
              本平台部分服务为付费服务，具体费用以购买时的页面展示为准。
              付费服务一经开通，除非法律法规另有规定或本平台另有约定，不支持无理由退款。
              我们保留调整服务费用的权利，调整前会提前通知。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">五、用户行为规范</h2>
            <p className="text-muted-foreground">用户在使用本平台时不得：</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
              <li>发布违法违规、虚假欺诈信息</li>
              <li>侵犯他人知识产权或其他合法权益</li>
              <li>干扰平台正常运行，包括但不限于攻击服务器、植入恶意代码</li>
              <li>利用平台进行不正当竞争或商业活动</li>
              <li>规避平台的安全措施或访问限制</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">六、免责声明</h2>
            <p className="text-muted-foreground">
              本平台按"现状"提供服务，不提供任何明示或暗示的保证。
              在法律允许的最大范围内，我们不对因使用本平台而产生的间接损失承担责任。
              平台上的商品信息由供应商提供，我们不保证信息的绝对准确性。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">七、条款变更</h2>
            <p className="text-muted-foreground">
              我们可能会不时修改本服务条款。修改后的条款将在发布后生效。
              如您在条款修改后继续使用本平台，视为您接受修改后的条款。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">八、法律适用与争议解决</h2>
            <p className="text-muted-foreground">
              本条款适用中华人民共和国法律。因本条款引起的争议，双方应友好协商解决；
              协商不成的，提交广州市有管辖权的人民法院诉讼解决。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">九、联系我们</h2>
            <p className="text-muted-foreground">
              如对本服务条款有任何疑问，请联系我们：<br />
              邮箱：support@lzdzhixuan.com<br />
              电话：400-888-6688
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
