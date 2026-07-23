"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CmbSeason = {
  code: string;
  name_zh: string;
  meta: any;
  sort_order: number;
};

export type CmbStyle = {
  code: string;
  name_zh: string;
  gender: string;
  type: string | null;
  frame: string | null;
  is_main: boolean;
  parent_code: string | null;
  direction: string | null;
  sort_order: number;
};

type Props = {
  seasons: string[];
  onSeasonsChange: (v: string[]) => void;
  styles: string[];
  onStylesChange: (v: string[]) => void;
  /** 风格按性别过滤：women / men / all */
  gender?: "women" | "men" | "all";
  seasonsList?: CmbSeason[];
  stylesList?: CmbStyle[];
};

function Chip({
  active,
  label,
  onClick,
  indent,
  tone = "default",
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  indent?: boolean;
  tone?: "default" | "season" | "main";
}) {
  const base =
    "px-3 py-1 rounded-full text-sm border transition-colors select-none cursor-pointer";
  const activeCls =
    tone === "season"
      ? "bg-[#b8945a] text-white border-[#b8945a]"
      : tone === "main"
      ? "bg-[#2d1b2e] text-white border-[#2d1b2e]"
      : "bg-primary text-white border-primary";
  const idleCls =
    "bg-white text-gray-700 border-gray-300 hover:border-gray-400";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${indent ? "ml-4 text-xs" : ""} ${
        active ? activeCls : idleCls
      }`}
    >
      {label}
    </button>
  );
}

export default function CmbTagger({
  seasons,
  onSeasonsChange,
  styles,
  onStylesChange,
  gender = "all",
  seasonsList,
  stylesList,
}: Props) {
  const [localSeasons, setLocalSeasons] = useState<CmbSeason[]>(seasonsList || []);
  const [localStyles, setLocalStyles] = useState<CmbStyle[]>(stylesList || []);
  const [loading, setLoading] = useState(!seasonsList || !stylesList);

  useEffect(() => {
    if (seasonsList && stylesList) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const [sRes, tRes] = await Promise.all([
          supabase.from("color_seasons").select("*").order("sort_order", { ascending: true }),
          supabase.from("style_tags").select("*").order("sort_order", { ascending: true }),
        ]);
        if (cancelled) return;
        if (sRes.data) setLocalSeasons(sRes.data as CmbSeason[]);
        if (tRes.data) setLocalStyles(tRes.data as CmbStyle[]);
      } catch (e) {
        console.error("[CmbTagger] 加载参考数失败", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seasonsList, stylesList]);

  const toggle = (list: string[], code: string, set: (v: string[]) => void) => {
    if (list.includes(code)) set(list.filter((c) => c !== code));
    else set([...list, code]);
  };

  const mainStyles = useMemo(
    () =>
      localStyles
        .filter((s) => s.is_main && (gender === "all" || s.gender === gender))
        .sort((a, b) => a.sort_order - b.sort_order),
    [localStyles, gender]
  );

  const subsOf = (mainCode: string) =>
    localStyles
      .filter((s) => !s.is_main && s.parent_code === mainCode)
      .sort((a, b) => a.sort_order - b.sort_order);

  if (loading) {
    return <div className="text-sm text-gray-400 py-2">加载色彩季型 / 风格库中…</div>;
  }

  return (
    <div className="space-y-5">
      {/* 色彩季型 */}
      <div>
        <div className="text-sm font-semibold text-gray-800 mb-2">
          色彩季型（可多选，权重最高）
        </div>
        <div className="flex flex-wrap gap-2">
          {localSeasons.map((s) => (
            <Chip
              key={s.code}
              tone="season"
              active={seasons.includes(s.code)}
              label={s.name_zh}
              onClick={() => toggle(seasons, s.code, onSeasonsChange)}
            />
          ))}
        </div>
      </div>

      {/* 穿衣风格 */}
      <div>
        <div className="text-sm font-semibold text-gray-800 mb-2">
          穿衣风格（主风格 + 偏风格，可多选）
        </div>
        <div className="space-y-2">
          {mainStyles.map((m) => {
            const subs = subsOf(m.code);
            return (
              <div key={m.code}>
                <Chip
                  tone="main"
                  active={styles.includes(m.code)}
                  label={`${m.name_zh}${m.frame ? `（${m.frame}）` : ""}`}
                  onClick={() => toggle(styles, m.code, onStylesChange)}
                />
                {subs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subs.map((sub) => (
                      <Chip
                        key={sub.code}
                        indent
                        active={styles.includes(sub.code)}
                        label={`${sub.name_zh}${sub.direction ? `·${sub.direction}` : ""}`}
                        onClick={() => toggle(styles, sub.code, onStylesChange)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
