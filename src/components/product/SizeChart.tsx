"use client";

interface Props {
  image?: string | null;
  sizesText?: string | null;
}

export default function SizeChart({ image, sizesText }: Props) {
  if (!image && !sizesText) return null;

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📏</span>
        <h2 className="text-base font-bold text-primary">尺码</h2>
      </div>

      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt="尺码表"
          className="w-full rounded-lg border border-gray-100"
        />
      ) : (
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {sizesText}
        </div>
      )}
    </section>
  );
}
