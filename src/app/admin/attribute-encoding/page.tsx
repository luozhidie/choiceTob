"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Database,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  ChevronRight,
  Layers,
  Palette,
  Scissors,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";

[supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  // 复制 SQL
  const copySQL = async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = MIGRATION_SQL;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 导入种子数据
  const handleSeed = async () => {
    setSeeding(true);
    setSeedError("");
    setSeedResult(null);
    try {
      const res = await fetch("/api/admin/seed-attributes", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSeedError(data.error || "导入失败");
        if (data.details) {
          setSeedResult(data.details);
        }
      } else {
        setSeedResult(data);
        // 刷新状态
        await loadStatuses();
      }
    } catch (e: any) {
      setSeedError(e.message || "请求失败");
    } finally {
      setSeeding(false);
    }
  };

  const allLoaded = Object.values(statuses).every((s) => !s.loading);
  const totalExpected = TABLES.reduce((sum, t) => sum + t.expected, 0);
  const totalActual = Object.values(statuses).reduce((sum, s) => sum + (s.count >= 0 ? s.count : 0), 0);
  const allSeeded = totalActual >= totalExpected;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">属性编码管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理风格属性编码体系（面料 / 图案 / 剪裁 / 色彩季型 / 搭配规则），共 {totalExpected} 条种子数据
          </p>
        </div>
        <button
          onClick={loadStatuses}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          刷新状态
        </button>
      </div>

      {/* 当前数据概览 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" />
          <h2 className="font-semibold text-gray-800">数据表状态</h2>
          {allLoaded && (
            <span
              className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${
                allSeeded
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {allSeeded ? "数据完整" : `已导入 ${totalActual}/${totalExpected}`}
            </span>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {TABLES.map((table) => {
            const status = statuses[table.name];
            const Icon = table.icon;
            return (
              <div key={table.name} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800">{table.label}</span>
                    <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                      {table.prefix}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{table.desc}</p>
                </div>
                <div className="text-right">
                  {status?.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                  ) : status?.error ? (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-xs">错误</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {status && status.count >= table.expected ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-amber-400" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          status && status.count >= table.expected
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {status?.count ?? 0}/{table.expected}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 步骤 1：Migration */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
            1
          </span>
          <h2 className="font-semibold text-gray-800">执行数据库迁移</h2>
          {migrationDone && (
            <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
              已完成
            </span>
          )}
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-500">
            色彩季型表需要新增 6 个字段（category_group / matrix_position / color_principle / test_colors / suitable_accessories / ideal_colors），请先在
            <a
              href="https://supabase.com/dashboard/project/_/sql"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline mx-1"
            >
              Supabase SQL Editor
            </a>
            中执行以下 SQL：
          </p>
          <div className="relative">
            <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto font-mono leading-relaxed">
              {MIGRATION_SQL}
            </pre>
            <button
              onClick={copySQL}
              className="absolute top-2 right-2 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white text-xs flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> 已复制
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> 复制
                </>
              )}
            </button>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setMigrationDone(true)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                migrationDone
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {migrationDone ? "已确认执行" : "我已执行完毕"}
            </button>
            <span className="text-xs text-gray-400">
              执行后请点击确认，否则种子数据导入会因缺少列而失败
            </span>
          </div>
        </div>
      </div>

      {/* 步骤 2：导入种子数据 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
            2
          </span>
          <h2 className="font-semibold text-gray-800">导入属性编码种子数据</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-500">
            一键导入全部 {totalExpected} 条属性编码数据到数据库（面料 8 + 图案 8 + 剪裁 45 + 色彩季型 12 + 搭配规则 7）。
            采用 upsert 方式，重复执行不会产生重复数据。
          </p>

          {!migrationDone && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                请先完成步骤1的数据库迁移（添加6个新列），否则色彩季型数据导入会失败。
              </p>
            </div>
          )}

          <button
            onClick={handleSeed}
            disabled={seeding || !migrationDone}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              seeding
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : !migrationDone
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
            }`}
          >
            {seeding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> 正在导入...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> 导入种子数据
              </>
            )}
          </button>

          {/* 结果展示 */}
          {seedResult && !seedError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 rounded-lg border border-green-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">{seedResult.message}</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(seedResult.counts).map(([key, val]) => (
                  <div key={key} className="text-center p-2 bg-white rounded-md">
                    <div className="text-lg font-bold text-green-600">{val as number}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {key === "fabrics"
                        ? "面料"
                        : key === "patterns"
                        ? "图案"
                        : key === "cuts"
                        ? "剪裁"
                        : key === "color_seasons"
                        ? "色彩季型"
                        : "搭配规则"}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {seedError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 rounded-lg border border-red-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">导入失败</span>
              </div>
              <p className="text-sm text-red-600">{seedError}</p>
              {seedResult && (
                <div className="mt-2 space-y-1">
                  {Object.entries(seedResult).map(([key, val]: [string, any]) => (
                    <div key={key} className="text-xs text-red-500">
                      {key}: {val.error || `${val.inserted} 条成功`}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* 属性体系架构图 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <h2 className="font-semibold text-gray-800">属性编码体系架构</h2>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { phase: "Phase 1", title: "数据层", status: "进行中", color: "indigo",
                items: ["面料 F01-F08", "图案 P01-P08", "剪裁 B/C/CA/EA 45条", "色彩季型 S01-S12", "搭配规则 R01-R07"] },
              { phase: "Phase 2", title: "商品打标", status: "待开发", color: "gray",
                items: ["商品上传时选属性编码", "自动生成风格结论", "标签管理界面"] },
              { phase: "Phase 3", title: "搭配引擎", status: "待开发", color: "gray",
                items: ["编码匹配算法", "自动生成搭配方案", "规则驱动推荐"] },
              { phase: "Phase 4", title: "灵感推送", status: "待开发", color: "gray",
                items: ["每日搭配灵感", "VIP个性化推送", "季节轮换主题"] },
            ].map((p) => (
              <div
                key={p.phase}
                className={`rounded-lg border-2 p-4 ${
                  p.color === "indigo"
                    ? "border-indigo-200 bg-indigo-50/50"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold ${p.color === "indigo" ? "text-indigo-600" : "text-gray-400"}`}>
                    {p.phase}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      p.status === "进行中"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <h3 className={`font-semibold text-sm mb-2 ${p.color === "indigo" ? "text-indigo-800" : "text-gray-500"}`}>
                  {p.title}
                </h3>
                <ul className="space-y-1">
                  {p.items.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-xs text-gray-500">
                      <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
