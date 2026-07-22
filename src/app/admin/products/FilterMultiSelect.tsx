"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X, Plus, Search, Check } from "lucide-react";

interface Props {
  label?: string;
  value: string[];
  onChange: (vals: string[]) => void;
  options: string[];
  placeholder?: string;
}

// 可拉开多选 + 搜索 + 自定义添加 + 点击外部关闭
export default function FilterMultiSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const allOptions = Array.from(new Set([...options, ...value])).sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN")
  );
  const kw = search.trim().toLowerCase();
  const filtered = kw
    ? allOptions.filter((o) => o.toLowerCase().includes(kw))
    : allOptions;
  const showCustom =
    kw.length > 0 && !allOptions.some((o) => o.toLowerCase() === kw);

  function toggle(opt: string) {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  }
  function addCustom() {
    const v = search.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setSearch("");
  }
  function remove(opt: string) {
    onChange(value.filter((v) => v !== opt));
  }

  return (
    <div className="relative" ref={ref}>
      <div
        className="w-full min-h-[40px] px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm flex flex-wrap items-center gap-1 cursor-pointer focus-within:ring-2 focus-within:ring-primary/20"
        onClick={() => setOpen(true)}
      >
        {value.length === 0 && (
          <span className="text-gray-400 px-1">
            {placeholder || "点击选择"}
          </span>
        )}
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs"
          >
            {v}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(v);
              }}
              className="hover:text-red-500"
              aria-label={`移除 ${v}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <ChevronDown
          size={16}
          className="ml-auto text-gray-400 shrink-0 pointer-events-none"
        />
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 flex flex-col">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索，或输入后回车自定义"
              className="flex-1 text-sm outline-none bg-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter" && showCustom) {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filtered.map((o) => {
              const active = value.includes(o);
              return (
                <button
                  type="button"
                  key={o}
                  onClick={() => toggle(o)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between hover:bg-gray-50 ${
                    active ? "text-primary font-medium" : "text-gray-700"
                  }`}
                >
                  <span>{o}</span>
                  {active && <Check size={14} className="text-primary shrink-0" />}
                </button>
              );
            })}
            {filtered.length === 0 && !showCustom && (
              <div className="px-2 py-3 text-center text-xs text-gray-400">
                无匹配项
              </div>
            )}
            {showCustom && (
              <button
                type="button"
                onClick={addCustom}
                className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-1 text-primary hover:bg-primary/5"
              >
                <Plus size={14} /> 自定义：{search.trim()}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
