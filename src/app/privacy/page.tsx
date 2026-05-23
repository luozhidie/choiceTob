import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-primary mb-8 inline-block"
        >
          &larr; 返回首页
        </Link>

        <h1 className="text-3xl font-bold text-primary mt-4 mb-2">隐私政策</h1>
        <p className="text-sm text-muted-foreground mb-10">最后更新：2026年5月21日</p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">一、信息收集</h2>
            <p className="text-muted-foreground">
              骆芷蝶智选（以下简称"我们"）在您使用平台服务时，可能会收集以下信息：
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
              <li>注册信息：您的姓名、手机号、邮箱地址、公司名称等</li>
              <li>使用信息：浏览记录、搜索记录、收藏商品、购买记录等</li>
              <li>设备信息：IP地址、浏览器类型、操作系统等</li>
              <li>色彩季型测试结果：您的个人色彩季型分析数据</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">二、信息使用</h2>
            <p className="text-muted-foreground">
              我们收集的信息将用于以下目的：
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
              <li>为您提供个性化的商品推荐和搭配建议</li>
              <li>优化平台功能和用户体验</li>
              <li>发送订单状态、服务通知和相关营销信息</li>
              <li>进行数据分析和市场研究，以改进我们的服务</li>
              <li>遵守法律法规要求</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">三、信息保护</h2>
            <p className="text-muted-foreground">
              我们采用行业标准的安全措施保护您的个人信息，包括SSL加密传输、数据脱敏处理、访问权限控制等。
              您的支付信息通过加密通道传输，我们不会以明文形式存储敏感支付信息。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">四、信息共享</h2>
            <p className="text-muted-foreground">
              我们不会将您的个人信息出售给第三方。在以下情况下，我们可能会共享您的信息：
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
              <li>经您明确同意</li>
              <li>为完成您所需的商品配送（与物流方共享必要信息）</li>
              <li>法律法规要求或政府部门依法要求</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">五、您的权利</h2>
            <p className="text-muted-foreground">
              您有权随时查看、修改、删除您的个人信息，或注销您的账户。
              如需行使这些权利，请联系我们的客服团队。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">六、联系我们</h2>
            <p className="text-muted-foreground">
              如对隐私政策有任何疑问，请联系我们：<br />
              邮箱：privacy@lzdzhixuan.com<br />
              电话：400-888-6688
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
