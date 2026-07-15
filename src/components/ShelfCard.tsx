"use client";

import Link from "next/link";

interface ShelfCardProps {
  block: any;
}

export default function ShelfCard({ block }: ShelfCardProps) {
  const content = block?.content || {};
  const image = content.image || "";
  const badge = content.badge || "";
  const subtitle = block?.section_subtitle || content.subtitle || "";

  const subImages = [content.subImage1, content.subImage2, content.subImage3].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href={`/shelf/${block.id}`}
        className="group block relative w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="aspect-[4/3] md:aspect-[3/2] relative bg-gradient-to-br from-gray-100 to-gray-200">
          {image ? (
            <img
              src={image}
              alt={block.title}
              className="w-full h-full object-contain object-center group-hover:scale-[1.02] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            {badge && (
              <span className="inline-block px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs mb-2">
                {badge}
              </span>
            )}
            <h3 className="text-xl md:text-2xl font-bold">{block.title}</h3>
            {subtitle && <p className="text-sm text-white/80 mt-1">{subtitle}</p>}
          </div>
        </div>
      </Link>

      {/* 3 张副图宣传 */}
      {subImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          {subImages.map((src: string, idx: number) => (
            <Link
              key={idx}
              href={`/shelf/${block.id}`}
              className="group block relative rounded-xl overflow-hidden bg-gray-100 aspect-[3/4]"
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
