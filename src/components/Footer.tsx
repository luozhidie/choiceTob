import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

const footerSections = [
  {
    title: "核心服务",
    links: [
      { label: "买手选品", href: "/buyer" },
      { label: "商品企划", href: "/planning" },
      { label: "企划工具", href: "/planning-tool" },
      { label: "爆款货盘", href: "/hot-picks" },
      { label: "陈列搭配", href: "/display" },
    ],
  },
  {
    title: "增值服务",
    links: [
      { label: "营销策划", href: "/marketing" },
      { label: "销售服务", href: "/sales" },
      { label: "VIP管理", href: "/vip" },
      { label: "教学中心", href: "/education" },
    ],
  },
  {
    title: "关于我们",
    links: [
      { label: "联系我们", href: "/contact" },
      { label: "隐私政策", href: "#" },
      { label: "服务条款", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent">
                <span className="text-primary font-bold text-sm">骆</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-lg tracking-wide">骆芷蝶智选</span>
                <span className="text-[10px] text-white/60 tracking-widest">
                  LUOZHDIE ZHIXUAN
                </span>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm mb-6">
              骆芷蝶智选是专注服装行业的ToB供应链智选平台，以数据驱动选品、企划、营销全链路，助力服装品牌实现精准运营与高效增长。
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span>广州市天河区珠江新城</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <span>400-888-6688</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span>contact@lzdzhixuan.com</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-sm mb-4 text-white/90">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <p>&copy; 2026 骆芷蝶智选. 保留所有权利.</p>
          <p>粤ICP备XXXXXXXX号</p>
        </div>
      </div>
    </footer>
  );
}
