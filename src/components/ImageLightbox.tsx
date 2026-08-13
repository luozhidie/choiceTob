"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface ImageLightboxProps {
  images: (string | null | undefined)[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  const validImages = images.filter(Boolean) as string[];
  const hasMultiple = validImages.length > 1;

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomed(false);
  }, [initialIndex, isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasMultiple) {
        setCurrentIndex((i) => (i - 1 + validImages.length) % validImages.length);
      }
      if (e.key === "ArrowRight" && hasMultiple) {
        setCurrentIndex((i) => (i + 1) % validImages.length);
      }
    },
    [isOpen, onClose, hasMultiple, validImages.length]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || validImages.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => { setZoomed(false); onClose(); }} />
      <button onClick={() => { setZoomed(false); onClose(); }} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
        <X className="w-6 h-6" />
      </button>
      <button onClick={() => setZoomed(!zoomed)} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/30 transition-colors">
        {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
      </button>
      {hasMultiple && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
          {currentIndex + 1} / {validImages.length}
        </div>
      )}
      {hasMultiple && (
        <button onClick={(e) => { e.stopPropagation(); setZoomed(false); setCurrentIndex((i) => (i - 1 + validImages.length) % validImages.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/30 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {hasMultiple && (
        <button onClick={(e) => { e.stopPropagation(); setZoomed(false); setCurrentIndex((i) => (i + 1) % validImages.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/30 transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
      <div className="relative z-[5] max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img src={validImages[currentIndex]} alt="" className={`max-h-[85vh] object-contain transition-transform duration-300 cursor-pointer ${zoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"}`} onClick={() => setZoomed(!zoomed)} />
      </div>
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 p-2 rounded-xl bg-black/40 backdrop-blur-sm">
          {validImages.map((img, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); setZoomed(false); setCurrentImage(i); }} className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === currentIndex ? "border-white opacity-100 scale-110" : "border-transparent opacity-60 hover:opacity-80"}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
