"use client";

import Link from "next/link";

interface AssortmentBlockProps {
  block: any;
}

// 与首页 safeSeriesBanner 一致：近黑内嵌渐变 / pollinations 生成图一律视为不可靠，走品牌粉兜底
function isSafeImage(u?: string | null): boolean {
  if (!u || u.trim() === "") return false;
  if (u.startsWith("data:image/svg")) return false;
  if (u.includes("pollinations.ai")) return false;
  return true;
}

export default function AssortmentCard({ block }: AssortmentBlockProps) {
  const content = block?.content || {};
  const image = content.image || "";
  const safeImage = isSafeImage(image) ? image : "";
  const badge = content.badge || "";
  const subtitle = block?.section_subtitle || content.subtitle || "";
  const planId = content.planId || "";

  const subImages = [content.subImage1, content.subImage2, content.subImage3].filter(Boolean);

  if (!planId) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href={`/assortment/${planId}`}
        className="group block relative w-full rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="aspect-[16/9] md:aspect-[2.5/1] relative bg-gradient-to-br from-[#6b3f70] via-[#a86fa0] to-[#d9a7c7]">
          {safeImage ? (
            <img
              src={safeImage}
              alt={block.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#6b3f70] via-[#a86fa0] to-[#d9a7c7]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-white">
            {badge && (
              <span className="inline-block px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs mb-2">
                {badge}
              </span>
            )}
            <h3 className="text-xl md:text-2xl font-bold">{block.title}</h3>
            {subtitle && <p className="text-sm text-white/80 mt-1 line-clamp-2 max-w-xl">{subtitle}</p>}
          </div>
        </div>
      </Link>

      {subImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          {subImages.map((src: string, idx: number) => (
            <Link
              key={idx}
              href={`/assortment/${planId}`}
              className="group block relative rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4]"
            >
              <img
                src={src}
                alt={`${block.title} 副图 ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
