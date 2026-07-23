"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CmbTagger, { CmbSeason, CmbStyle } from "@/components/admin/CmbTagger";

type Product = {
  id: string;
  title: string;
  cover_image: string | null;
  is_published: boolean;
  color_season_codes: string[];
  style_tag_codes: string[];
};

type Plan = {
  id: string;
  title: string;
  season: string | null;
  status: string | null;
  target_color_seasons: string[];
  target_style_tags: string[];
};

type Diagnosis = {
  id: string;
  full_name: string | null;
  gender: string | null;
  status: string;
  answers: any;
  result_color_seasons: string[];
  result_style_tags: string[];
};

const TABS = [
  { key: "product", label: "商品打标" },
  { key: "assortment", label: "组货目标" },
  { key: "diagnosis", label: "风格诊断结果" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

async function adminUpdate(table: string, id: string, data: Record<string, unknown>) {
  const res = await fetch("/api/admin/products/update", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, table, data }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

export default function CmbAdminPage() {
  const [tab, setTab] = useState<TabKey>("product");
  const [seasonsList, setSeasonsList] = useState<CmbSeason[]>([]);
  const [stylesList, setStylesList] = useState<CmbStyle[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [s, t] = await Promise.all([
        supabase.from("color_seasons").select("*").order("sort_order", { ascending: true }),
        supabase.from("style_tags").select("*").order("sort_order", { ascending: true }),
      ]);
      if (s.data) setSeasonsList(s.data as CmbSeason[]);
      if (t.data) setStylesList(t.data as CmbStyle[]);
    })();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-1">CMB 打标管理</h1>
      <p className="text-sm text-gray-500 mb-4">
        用本系统色彩季型 + 穿衣风格（女士 8 主 56 偏 / 男士 5 主 20 偏）给商品、组货方案、风格诊断结果打标。
      </p>

      <div className="flex gap-2 mb-6 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "product" && (
        <ProductTab seasonsList={seasonsList} stylesList={stylesList} />
      )}
      {tab === "assortment" && (
        <AssortmentTab seasonsList={seasonsList} stylesList={stylesList} />
      )}
      {tab === "diagnosis" && (
        <DiagnosisTab seasonsList={seasonsList} stylesList={stylesList} />
      )}
    </div>
  );
}

/* ───────────────────────── 商品打标 ───────────────────────── */
function ProductTab({
  seasonsList,
  stylesList,
}: {
  seasonsList: CmbSeason[];
  stylesList: CmbStyle[];
}) {
  const [list, setList] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string>("");

  const load = async (term = "") => {
    setLoading(true);
    try {
      const supabase = createClient();
      let q = supabase
        .from("products")
        .select(
          "id,title,cover_image,is_published,color_season_codes,style_tag_codes"
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (term.trim()) q = q.ilike("title", `%${term.trim()}%`);
      const { data } = await q;
      if (data) setList(data as Product[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const open = (p: Product) => {
    setSelected(p);
    setSeasons(p.color_season_codes || []);
    setStyles(p.style_tag_codes || []);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminUpdate("products", selected.id, {
        color_season_codes: seasons,
        style_tag_codes: styles,
      });
      setList((l) =>
        l.map((p) =>
          p.id === selected.id
            ? { ...p, color_season_codes: seasons, style_tag_codes: styles }
            : p
        )
      );
      setToast("已保存");
      setTimeout(() => setToast(""), 2000);
    } catch (e: any) {
      setToast("保存失败：" + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="flex gap-2 mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索商品标题"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button
            onClick={() => load(search)}
            className="px-3 py-2 bg-primary text-white rounded text-sm"
          >
            搜索
          </button>
        </div>
        {loading && <div className="text-sm text-gray-400">加载中…</div>}
        <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => open(p)}
              className={`w-full flex items-center gap-3 p-2 rounded border text-left ${
                selected?.id === p.id ? "border-primary bg-primary/5" : "border-gray-200"
              }`}
            >
              {p.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.cover_image}
                  alt=""
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-gray-100" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{p.title}</div>
                <div className="text-xs text-gray-400">
                  {p.is_published ? "已发布" : "草稿"} · 季型{" "}
                  {(p.color_season_codes || []).length} · 风格{" "}
                  {(p.style_tag_codes || []).length}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        {!selected ? (
          <div className="text-sm text-gray-400 py-10 text-center border rounded">
            从左侧选择商品进行打标
          </div>
        ) : (
          <div className="border rounded p-4 space-y-4">
            <div className="text-sm font-semibold truncate">{selected.title}</div>
            <CmbTagger
              seasonsList={seasonsList}
              stylesList={stylesList}
              seasons={seasons}
              onSeasonsChange={setSeasons}
              styles={styles}
              onStylesChange={setStyles}
            />
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-2 bg-primary text-white rounded text-sm disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存打标"}
            </button>
            {toast && <div className="text-xs text-center text-gray-500">{toast}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── 组货目标 ───────────────────────── */
function AssortmentTab({
  seasonsList,
  stylesList,
}: {
  seasonsList: CmbSeason[];
  stylesList: CmbStyle[];
}) {
  const [list, setList] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("assortment_plans")
        .select(
          "id,title,season,status,target_color_seasons,target_style_tags"
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) setList(data as Plan[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const open = (p: Plan) => {
    setSelected(p);
    setSeasons(p.target_color_seasons || []);
    setStyles(p.target_style_tags || []);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminUpdate("assortment_plans", selected.id, {
        target_color_seasons: seasons,
        target_style_tags: styles,
      });
      setList((l) =>
        l.map((p) =>
          p.id === selected.id
            ? { ...p, target_color_seasons: seasons, target_style_tags: styles }
            : p
        )
      );
      setToast("已保存");
      setTimeout(() => setToast(""), 2000);
    } catch (e: any) {
      setToast("保存失败：" + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (s: string | null) =>
    s === "published" ? "已发布" : s === "archived" ? "已归档" : "规划中";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        {loading && <div className="text-sm text-gray-400">加载中…</div>}
        <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => open(p)}
              className={`w-full p-3 rounded border text-left ${
                selected?.id === p.id ? "border-primary bg-primary/5" : "border-gray-200"
              }`}
            >
              <div className="text-sm font-medium">{p.title}</div>
              <div className="text-xs text-gray-400">
                {p.season || "全年"} · {statusLabel(p.status)} · 目标季型{" "}
                {(p.target_color_seasons || []).length} · 目标风格{" "}
                {(p.target_style_tags || []).length}
              </div>
            </button>
          ))}
          {!loading && list.length === 0 && (
            <div className="text-sm text-gray-400 py-10 text-center border rounded">
              暂无组货方案
            </div>
          )}
        </div>
      </div>

      <div>
        {!selected ? (
          <div className="text-sm text-gray-400 py-10 text-center border rounded">
            从左侧选择组货方案设定目标客群
          </div>
        ) : (
          <div className="border rounded p-4 space-y-4">
            <div className="text-sm font-semibold">{selected.title}</div>
            <p className="text-xs text-gray-500">
              设定该组货方案想覆盖的色彩季型与穿衣风格（买手大方向框到个人层）。
            </p>
            <CmbTagger
              seasonsList={seasonsList}
              stylesList={stylesList}
              seasons={seasons}
              onSeasonsChange={setSeasons}
              styles={styles}
              onStylesChange={setStyles}
            />
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-2 bg-primary text-white rounded text-sm disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存目标"}
            </button>
            {toast && <div className="text-xs text-center text-gray-500">{toast}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── 风格诊断结果映射 ─────────────────── */
function DiagnosisTab({
  seasonsList,
  stylesList,
}: {
  seasonsList: CmbSeason[];
  stylesList: CmbStyle[];
}) {
  const [list, setList] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Diagnosis | null>(null);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("style_diagnoses")
        .select(
          "id,full_name,gender,status,result_color_seasons,result_style_tags"
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) setList(data as Diagnosis[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const open = (d: Diagnosis) => {
    setSelected(d);
    setSeasons(d.result_color_seasons || []);
    setStyles(d.result_style_tags || []);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminUpdate("style_diagnoses", selected.id, {
        result_color_seasons: seasons,
        result_style_tags: styles,
      });
      setList((l) =>
        l.map((d) =>
          d.id === selected.id
            ? { ...d, result_color_seasons: seasons, result_style_tags: styles }
            : d
        )
      );
      setToast("已映射");
      setTimeout(() => setToast(""), 2000);
    } catch (e: any) {
      setToast("保存失败：" + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const genderLabel = (g: string | null) =>
    g === "male" ? "男" : g === "female" ? "女" : "—";

  // 按诊断性别过滤风格，便于打标
  const filterGender = useMemo<'women' | 'men' | 'all'>(() => {
    if (selected?.gender === "male") return "men";
    if (selected?.gender === "female") return "women";
    return "all";
  }, [selected]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        {loading && <div className="text-sm text-gray-400">加载中…</div>}
        <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
          {list.map((d) => (
            <button
              key={d.id}
              onClick={() => open(d)}
              className={`w-full p-3 rounded border text-left ${
                selected?.id === d.id ? "border-primary bg-primary/5" : "border-gray-200"
              }`}
            >
              <div className="text-sm font-medium">
                {d.full_name || "匿名"} · {genderLabel(d.gender)}
              </div>
              <div className="text-xs text-gray-400">
                {d.status} · 已映射季型 {(d.result_color_seasons || []).length} · 风格{" "}
                {(d.result_style_tags || []).length}
              </div>
            </button>
          ))}
          {!loading && list.length === 0 && (
            <div className="text-sm text-gray-400 py-10 text-center border rounded">
              暂无诊断记录
            </div>
          )}
        </div>
      </div>

      <div>
        {!selected ? (
          <div className="text-sm text-gray-400 py-10 text-center border rounded">
            从左侧选择诊断记录，映射其色彩季型与风格
          </div>
        ) : (
          <div className="border rounded p-4 space-y-4">
            <div className="text-sm font-semibold">
              {selected.full_name || "匿名"} · {genderLabel(selected.gender)}
            </div>
            <p className="text-xs text-gray-500">
              将风格测试结果映射到本系统色彩季型 + 风格（结果可直接用于
              recommend_products_by_season 推荐）。
            </p>
            <CmbTagger
              seasonsList={seasonsList}
              stylesList={stylesList}
              gender={filterGender}
              seasons={seasons}
              onSeasonsChange={setSeasons}
              styles={styles}
              onStylesChange={setStyles}
            />
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-2 bg-primary text-white rounded text-sm disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存映射"}
            </button>
            {toast && <div className="text-xs text-center text-gray-500">{toast}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
