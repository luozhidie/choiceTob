"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search, Loader2, Plus, CheckCircle2, ExternalLink,
  MapPin, Phone, Building2, Globe, ChevronRight,
  Filter, Download, AlertCircle, Upload, Trash2,
  Edit3, X,
} from "lucide-react";

interface ParsedStore {
  id: string;
  name: string;
  address: string;
  phone: string;
  industry: string;
  city: string;
  source_detail: string;
  selected: boolean;
  parsed: boolean;
  rawLines: string[];
}

const INDUSTRY_OPTIONS = ["服装店", "轮胎店", "滋补行", "其他"];

// ======== 合并去重（按店名+地址）========
function mergeAndDedup(results: ParsedStore[]): ParsedStore[] {
  const seen = new Map<string, ParsedStore>();
  for (const r of results) {
    const key = `${r.name}||${r.address}`.toLowerCase().replace(/\s+/g, "");
    if (!seen.has(key)) {
      seen.set(key, r);
    }
    // 如果已存在，优先保留有电话的
    else {
      const existing = seen.get(key)!;
      if (!existing.parsed && r.parsed) {
        seen.set(key, r);
      }
    }
  }
  return Array.from(seen.values());
}

// ======== 智能解析器（粘贴模式）========
function parseSearchResults(text: string, defaultIndustry: string): ParsedStore[] {
  const lines = text.split(/\n/).map(l => l.trim()).filter(l => l);
  const results: ParsedStore[] = [];
  let current: Partial<ParsedStore> | null = null;
  let currentRaw: string[] = [];
  let index = 0;

  const extractPhone = (s: string): string => {
    const matches = s.match(/(?:电话[:：]|Tel[:：]|联系方式[:：]|手机[:：])?\s*([\d\s\-]{7,15})/);
    if (matches) return matches[1].replace(/[\s\-]/g, "");
    const mobile = s.match(/1[3-9]\d{9}/);
    if (mobile) return mobile[0];
    return "";
  };

  const isNewRecord = (line: string): boolean => {
    if (/^\d+[\.、\)\]\s]/.test(line)) return true;
    if (/\d+\.?\d*\s*(km|米)/.test(line)) return true;
    if (line.includes("有限公司") || line.includes("经营部") || (line.includes("店") && line.length < 30)) {
      return !!current?.phone;
    }
    return false;
  };

  const flushCurrent = () => {
    if (current && current.name) {
      results.push({
        id: `tmp_${index++}`,
        name: current.name || "",
        address: current.address || "",
        phone: current.phone || "",
        industry: current.industry || defaultIndustry,
        city: current.city || "",
        source_detail: current.source_detail || "粘贴导入",
        selected: true,
        parsed: !!current.phone,
        rawLines: [...currentRaw],
      });
    }
    current = null;
    currentRaw = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (isNewRecord(line) && current) flushCurrent();
    if (!current) {
      current = { name: "", address: "", phone: "", city: "" };
      currentRaw = [];
    }
    currentRaw.push(line);
    const nameMatch = line.match(/^\d+[\.、\)\]\s]+(.+)/);
    const cleanName = nameMatch ? nameMatch[1].trim() : line;
    if (!current.name) {
      current.name = cleanName.replace(/\d+\.?\d*\s*(km|米)/, "").trim();
      continue;
    }
    const phone = extractPhone(line);
    if (phone && !current.phone) {
      current.phone = phone;
      continue;
    }
    if (/地址[:：]|^[^\d]*(?:省|市|区|县|路|街|号|栋|层|室|镇|乡|村)/.test(line) ||
        /\d+号|\d+栋|\d+层|\d+室/.test(line) ||
        (line.length > 5 && !line.includes("电话") && !line.includes("评分") && !current.address)) {
      if (!current.address) current.address = line.replace(/^地址[:：]?\s*/, "").trim();
      else current.address += " " + line.trim();
    }
    const cityMatch = line.match(/(\S+市)/);
    if (cityMatch && !current.city) current.city = cityMatch[1];
  }

  flushCurrent();
  return results.filter(r => r.name.length > 1);
}

export default function CrmScrapePage() {
  const [mode, setMode] = useState<"api" | "paste">("paste");
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [industry, setIndustry] = useState("服装店");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [parsedResults, setParsedResults] = useState<ParsedStore[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; dups: number } | null>(null);
  const [showOnlyValid, setShowOnlyValid] = useState(false);
  const [editingStore, setEditingStore] = useState<ParsedStore | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "", industry: "服装店" });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const supabase = createClient();

  // API 搜索（走后端路由，避免浏览器CORS）
  const handleApiSearch = async (targetPage?: number) => {
    if (!keyword.trim() || !city.trim()) {
      alert("请填写城市和关键词");
      return;
    }
    const currentPage = targetPage || page;
    setSearching(true);
    setSearchError(null);
    if (currentPage === 1) {
      setParsedResults([]);
    }
    setImportResult(null);

    try {
      const res = await fetch("/api/crm/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, city, industry, page: currentPage }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setSearchError(data.error || data.message || "搜索失败");
        setSearching(false);
        return;
      }

      if (!data.results || data.results.length === 0) {
        if (currentPage === 1) {
          setSearchError(data.message || "未找到结果，请尝试更换关键词或城市");
        } else {
          setHasMore(false);
        }
        setSearching(false);
        return;
      }

      // 转换为 ParsedStore 格式
      const newResults: ParsedStore[] = data.results.map((poi: any, idx: number) => ({
        id: poi.id || `poi_${idx}_${currentPage}`,
        name: poi.name || "",
        address: poi.address || "",
        phone: poi.phone || "",
        industry: poi.industry || (keyword.includes("服装") ? "服装店" : keyword.includes("轮胎") ? "轮胎店" : keyword.includes("滋补") ? "滋补行" : "其他"),
        city: poi.city || city,
        source_detail: poi.source_detail || "地图POI",
        selected: true,
        parsed: !!(poi.phone || ""),
        rawLines: [poi.name, poi.address, poi.phone].filter(Boolean),
      }));

      // 查询已存在的门店，过滤掉已采集过的
      const allNames = [...new Set(newResults.map(r => r.name))];
      const { data: existing } = await supabase
        .from("crm_stores")
        .select("name")
        .in("name", allNames);
      const existingNames = new Set((existing || []).map((e: any) => e.name));
      const filtered = newResults.filter(r => !existingNames.has(r.name));
      const dupCount = newResults.length - filtered.length;

      // 合并去重（按店名+地址）
      const merged = mergeAndDedup(filtered);
      
      setParsedResults(prev => {
        const combined = [...prev, ...merged];
        const seen = new Map<string, ParsedStore>();
        for (const r of combined) {
          const key = `${r.name}||${r.address}`.toLowerCase().replace(/\s+/g, "");
          if (!seen.has(key)) seen.set(key, r);
        }
        return Array.from(seen.values());
      });
      
      console.log(`第${currentPage}页：过滤已存在 ${dupCount} 条，新增 ${merged.length} 条`);
      if (merged.length === 0 && currentPage === 1) {
        setSearchError(`所有结果都已存在（${newResults.length} 条），无需重复采集`);
      }
      
      setHasMore(data.results.length >= 20);
      setPage(currentPage + 1);
    } catch (e: any) {
      setSearchError(e.message || "搜索失败，请检查网络连接");
    } finally {
      setSearching(false);
    }
  };

  const handleParse = () => {
    if (!pasteText.trim()) return;
    const results = parseSearchResults(pasteText, industry);
    setParsedResults(results);
    setImportResult(null);
  };

  const handleImport = async () => {
    const selected = parsedResults.filter(r => r.selected && r.parsed);
    if (selected.length === 0) { alert("请至少选择一条有效数据"); return; }
    setImporting(true);

    try {
      // 查询已存在的店名（避免重复导入）
      const selectedNames = selected.map(r => r.name);
      const { data: existing } = await supabase
        .from("crm_stores")
        .select("name")
        .in("name", selectedNames);
      const existingNames = new Set((existing || []).map(e => e.name));
      const newRecords = selected.filter(r => !existingNames.has(r.name));
      const dupCount = selected.length - newRecords.length;

      if (newRecords.length === 0) {
        setImportResult({ success: 0, failed: 0, dups: dupCount });
        setImporting(false);
        return;
      }

      const records = newRecords.map(r => ({
        name: r.name,
        address: r.address || "",
        owner_phone: r.phone || "待补充",
        industry: r.industry,
        source: mode === "api" ? "import" as const : "scrape" as const,
        source_detail: r.source_detail,
        status: "active" as const,
      }));

      const { error } = await supabase.from("crm_stores").insert(records);
      if (error) {
        console.error("导入失败:", error);
        alert("导入失败：" + error.message);
      } else {
        setImportResult({ success: newRecords.length, failed: 0, dups: dupCount });
        setParsedResults(prev => prev.filter(r => !r.selected || existingNames.has(r.name)));
      }
    } catch (e: any) {
      console.error("导入异常:", e);
      alert("导入异常：" + (e.message || "未知错误"));
    }
    setImporting(false);
  };

  const toggleSelect = (id: string) => {
    setParsedResults(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const toggleSelectAll = () => {
    const ids = new Set(displayResults.map(r => r.id));
    const allSelected = displayResults.every(r => r.selected);
    setParsedResults(prev => prev.map(r => ids.has(r.id) ? { ...r, selected: !allSelected } : r));
  };

  const deleteItem = (id: string) => {
    setParsedResults(prev => prev.filter(r => r.id !== id));
  };

  const startEdit = (store: ParsedStore) => {
    setEditingStore(store);
    setEditForm({
      name: store.name,
      phone: store.phone,
      address: store.address,
      industry: store.industry,
    });
  };

  const saveEdit = () => {
    if (!editingStore) return;
    setParsedResults(prev => prev.map(r =>
      r.id === editingStore.id
        ? { ...r, name: editForm.name, phone: editForm.phone, address: editForm.address, industry: editForm.industry, parsed: !!editForm.phone }
        : r
    ));
    setEditingStore(null);
  };

  const selectedCount = parsedResults.filter(r => r.selected).length;
  const displayResults = showOnlyValid ? parsedResults.filter(r => r.parsed) : parsedResults;
  const validCount = displayResults.filter(r => r.selected && r.parsed).length;
  const invalidCount = displayResults.filter(r => r.selected && !r.parsed).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">门店信息采集</h1>
        <p className="text-muted-foreground mt-1">从地图平台搜索或粘贴搜索结果，一键导入潜客库</p>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => { setMode("paste"); setParsedResults([]); setSearchError(null); setPage(1); setHasMore(true); }}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "paste" ? "bg-accent text-primary" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}>
          <Upload className="w-4 h-4 inline mr-2" />粘贴搜索结果
        </button>
        <button onClick={() => { setMode("api"); setParsedResults([]); setSearchError(null); setPage(1); setHasMore(true); }}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "api" ? "bg-accent text-primary" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}>
          <Globe className="w-4 h-4 inline mr-2" />API自动采集
        </button>
      </div>

      {mode === "paste" ? (
        <>
          {/* 粘贴模式 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input type="text" list="industry-list" value={industry} onChange={(e) => setIndustry(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-36" placeholder="行业" />
              <datalist id="industry-list">
                {INDUSTRY_OPTIONS.map(i => <option key={i} value={i} />)}
              </datalist>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-36" placeholder="城市（如杭州）" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-primary mb-2">
                粘贴搜索结果 <span className="text-muted-foreground font-normal">（支持百度地图、高德地图、天眼查等格式）</span>
              </label>
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={8}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono resize-none"
                placeholder={`示例格式：
1. 米其林轮胎(龙泽路店)
江西省赣州市龙南市沿江路9号
电话:18179713632

2. 米其林(金星路店)
景荣嘉苑41-45号店铺
电话:13479748729`} />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleParse} disabled={!pasteText.trim()}
                className="btn-primary flex items-center gap-2">
                <Search className="w-4 h-4" /> 解析数据
              </button>
              <button onClick={() => { setPasteText(""); setParsedResults([]); setImportResult(null); }}
                className="btn-secondary text-sm">清空</button>
            </div>
          </div>
        </>
      ) : (
        /* API 采集模式 */
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input type="text" list="industry-list" value={industry} onChange={(e) => setIndustry(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-36" placeholder="行业" />
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-36" placeholder="城市（如杭州）" />
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="关键词（如女装店、轮胎专卖）" />
            <button onClick={() => { setPage(1); setHasMore(true); handleApiSearch(1); }} disabled={searching || !keyword.trim() || !city.trim()}
              className="btn-primary flex items-center gap-2 px-6 whitespace-nowrap">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              搜索
            </button>
          </div>

          {searchError && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">{searchError}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>API自动采集</strong>：填写城市和关键词，点击搜索即可从高德/百度地图获取门店信息。
              优先使用高德地图API，失败时自动切换百度地图API。
            </p>
          </div>
        </div>
      )}

      {/* 解析/搜索结果 */}
      {parsedResults.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={displayResults.length > 0 && displayResults.every(r => r.selected)}
                  onChange={toggleSelectAll} className="w-4 h-4 accent-accent" />
                <span>全选（{displayResults.length}条）</span>
              </label>
              <span className="text-xs text-green-600">有效 {validCount}</span>
              {invalidCount > 0 && <span className="text-xs text-red-500">无效 {invalidCount}</span>}
              {invalidCount > 0 && (
                <label className="flex items-center gap-1.5 cursor-pointer text-xs ml-2">
                  <input type="checkbox" checked={showOnlyValid} onChange={e => setShowOnlyValid(e.target.checked)}
                    className="w-3.5 h-3.5 accent-accent" />
                  <span className="text-gray-600">只看有电话</span>
                </label>
              )}
            </div>
            <button onClick={handleImport} disabled={importing || validCount === 0}
              className="btn-primary flex items-center gap-2 text-sm">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              导入选中（{validCount}）
            </button>
          </div>

          {/* 导入结果 */}
          {importResult && (
            <div className={`rounded-lg p-4 mb-4 ${importResult.success > 0 ? "bg-green-50 border border-green-100" : "bg-yellow-50 border border-yellow-100"}`}>
              <div className="text-sm">
                <span className="font-medium">导入结果：</span>
                成功 <span className="text-green-600 font-bold">{importResult.success}</span> 条
                {importResult.dups > 0 && <span className="text-orange-600 ml-2">跳过重复 {importResult.dups} 条</span>}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {displayResults.map((r) => (
              <div key={r.id} className={`rounded-xl border p-4 flex items-center gap-4 transition-colors ${
                r.parsed ? (r.selected ? "bg-accent/5 border-accent/20" : "bg-white border-gray-100") : "bg-red-50/50 border-red-100"
              }`}>
                <input type="checkbox" checked={r.selected} onChange={() => toggleSelect(r.id)}
                  className="w-4 h-4 accent-accent flex-shrink-0" />
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${r.parsed ? 'bg-blue-50' : 'bg-red-50'}`}>
                  {r.parsed ? <Building2 className="w-5 h-5 text-blue-600" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-primary text-sm">{r.name}</span>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{r.industry}</span>
                    {!r.parsed && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-xs">缺少手机号</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {r.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.address}</span>}
                    {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.source_detail}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(r)} className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg" title="编辑"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteItem(r.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="删除"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          
          {/* 加载更多（仅API模式） */}
          {mode === "api" && hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => handleApiSearch(page)}
                disabled={searching}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                加载更多
              </button>
            </div>
          )}
        </div>
      )}

      {/* 使用指引（仅粘贴模式无数据时显示） */}
      {parsedResults.length === 0 && mode === "paste" && !pasteText && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 mt-6">
          <h3 className="font-semibold text-primary mb-4">如何使用</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <div className="font-medium text-primary text-sm mb-1">1. 外部搜索</div>
              <p className="text-xs text-muted-foreground">在百度地图/高德地图/天眼查搜索目标门店</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <div className="font-medium text-primary text-sm mb-1">2. 粘贴结果</div>
              <p className="text-xs text-muted-foreground">复制搜索结果，粘贴到上方文本框</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-accent" />
              </div>
              <div className="font-medium text-primary text-sm mb-1">3. 一键导入</div>
              <p className="text-xs text-muted-foreground">系统自动解析，勾选后导入潜客库</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">支持的平台：</p>
            <div className="flex flex-wrap gap-2">
              {["百度地图", "高德地图", "天眼查", "企查查", "大众点评"].map(p => (
                <span key={p} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600">{p}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editingStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-primary">编辑门店信息</h3>
              <button onClick={() => setEditingStore(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">店名</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">手机号 <span className="text-red-500">*</span></label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="11位手机号" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">地址</label>
                <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">行业</label>
                <input type="text" list="industry-list" value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="输入或选择行业" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button onClick={() => setEditingStore(null)} className="btn-secondary text-sm">取消</button>
                <button onClick={saveEdit} className="btn-primary text-sm">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
