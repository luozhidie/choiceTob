"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  ChevronDown,
  Upload,
  X,
  CheckCircle2,
  ImageIcon,
  Package,
} from "lucide-react";
import { useState, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const colorSeasons = [
  {
    group: "春季型",
    sub: [
      { name: "浅春型", color: "#FADADD", textColor: "#8B4560" },
      { name: "暖春型", color: "#FFD966", textColor: "#7A6020" },
      { name: "净春型", color: "#FF8C69", textColor: "#6B2A1A" },
    ],
  },
  {
    group: "夏季型",
    sub: [
      { name: "浅夏型", color: "#B0C4DE", textColor: "#2E4A6E" },
      { name: "冷夏型", color: "#8FA5C0", textColor: "#1E3050" },
      { name: "柔夏型", color: "#9EB1B9", textColor: "#2A3E45" },
    ],
  },
  {
    group: "秋季型",
    sub: [
      { name: "深秋型", color: "#8B4513", textColor: "#FFFFFF" },
      { name: "暖秋型", color: "#CD853F", textColor: "#3E2210" },
      { name: "柔秋型", color: "#C4A882", textColor: "#3E2E1A" },
    ],
  },
  {
    group: "冬季型",
    sub: [
      { name: "深冬型", color: "#1a365d", textColor: "#FFFFFF" },
      { name: "冷冬型", color: "#4169E1", textColor: "#FFFFFF" },
      { name: "净冬型", color: "#E0E0E0", textColor: "#333333" },
    ],
  },
];

const styleTypes = [
  "淑女风",
  "知性风",
  "名媛风",
  "中性风",
  "潮牌风",
  "职业风",
  "休闲风",
  "大牌风",
  "气场型男",
  "随性达人",
  "精英绅士",
  "优雅先生",
  "潮流先锋",
];

const fabricOptions = ["棉", "麻", "丝", "毛", "涤纶", "锦纶", "混纺", "其他"];
const seasonOptions = ["春", "夏", "秋", "冬", "四季"];
const occasionOptions = ["通勤", "社交", "休闲", "运动"];
const fitOptions = ["修身", "直筒", "宽松"];
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "均码"];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SupplierSubmitPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);

  const [form, setForm] = useState({
    name: "",
    colorSeason: "",
    styleType: "",
    stock: "",
    wholesalePrice: "",
    retailPrice: "",
    description: "",
    fabrics: [] as string[],
    seasons: [] as string[],
    occasions: [] as string[],
    fits: [] as string[],
    sizes: [] as string[],
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: string[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newImages.push(url);
    });
    setImages((prev) => [...prev, ...newImages].slice(0, 8));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCheckbox = (
    field: "fabrics" | "seasons" | "occasions" | "fits" | "sizes",
    value: string
  ) => {
    setForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const CheckboxGroup = ({
    label,
    field,
    options,
  }: {
    label: string;
    field: "fabrics" | "seasons" | "occasions" | "fits" | "sizes";
    options: string[];
  }) => (
    <div>
      <label className="block text-sm font-medium text-primary mb-3">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggleCheckbox(field, opt)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              form[field].includes(opt)
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Toast */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl shadow-2xl"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">商品提交成功！</p>
            <p className="text-sm text-white/80">
              您的商品已进入审核流程，预计1-2个工作日内完成审核。
            </p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="ml-4 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Breadcrumb */}
      <div className="bg-muted border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href="/supplier"
              className="hover:text-primary transition-colors"
            >
              一手货源
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-medium">提交商品</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <Package className="w-4 h-4" />
              商品提交
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold">提交商品信息</h1>
            <p className="mt-3 text-white/70 max-w-xl leading-relaxed">
              完整填写商品信息，包括色彩季型与风格定位，帮助我们精准匹配品牌需求。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 lg:py-20 bg-muted">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {/* Section 1: Basic Info */}
            <motion.div
              variants={fadeUp}
              className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm"
            >
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">
                  1
                </span>
                基本信息
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    商品名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="请输入商品名称"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    商品图片 <span className="text-xs text-muted-foreground ml-2">最多8张</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group"
                      >
                        <img
                          src={img}
                          alt={`商品图${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 8 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-accent/50 hover:bg-accent/5 transition-all"
                      >
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-400 mt-1">添加</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>
            </motion.div>

            {/* Section 2: Color Season */}
            <motion.div
              variants={fadeUp}
              className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm"
            >
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">
                  2
                </span>
                色彩季型
              </h2>

              <div className="space-y-4">
                {colorSeasons.map((season) => (
                  <div key={season.group}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      {season.group}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {season.sub.map((sub) => (
                        <button
                          key={sub.name}
                          type="button"
                          onClick={() =>
                            setForm({ ...form, colorSeason: sub.name })
                          }
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                            form.colorSeason === sub.name
                              ? "border-accent shadow-md scale-105"
                              : "border-transparent hover:border-gray-200"
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-full shrink-0 border border-white shadow-sm"
                            style={{ backgroundColor: sub.color }}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {sub.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {form.colorSeason && (
                <div className="mt-4 p-3 bg-accent/5 rounded-lg border border-accent/20 flex items-center gap-2">
                  <span className="text-sm text-accent font-medium">
                    已选择：{form.colorSeason}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Section 3: Style Type */}
            <motion.div
              variants={fadeUp}
              className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm"
            >
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">
                  3
                </span>
                风格类型
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {styleTypes.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setForm({ ...form, styleType: style })}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      form.styleType === style
                        ? "bg-primary text-white border-primary shadow-md"
                        : "bg-white text-gray-600 border-gray-200 hover:border-accent/50 hover:text-primary"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Section 4: Price & Stock */}
            <motion.div
              variants={fadeUp}
              className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm"
            >
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">
                  4
                </span>
                价格与库存
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    库存数量 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.stock}
                      onChange={(e) =>
                        setForm({ ...form, stock: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm pr-12"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      件
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    批发价格 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ¥
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={form.wholesalePrice}
                      onChange={(e) =>
                        setForm({ ...form, wholesalePrice: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    零售价格 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ¥
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={form.retailPrice}
                      onChange={(e) =>
                        setForm({ ...form, retailPrice: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 5: Attributes */}
            <motion.div
              variants={fadeUp}
              className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm"
            >
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">
                  5
                </span>
                商品属性
              </h2>

              <div className="space-y-6">
                <CheckboxGroup
                  label="面料成分"
                  field="fabrics"
                  options={fabricOptions}
                />
                <CheckboxGroup
                  label="适用季节"
                  field="seasons"
                  options={seasonOptions}
                />
                <CheckboxGroup
                  label="适用场合"
                  field="occasions"
                  options={occasionOptions}
                />
                <CheckboxGroup
                  label="版型"
                  field="fits"
                  options={fitOptions}
                />
                <CheckboxGroup
                  label="尺码范围"
                  field="sizes"
                  options={sizeOptions}
                />
              </div>
            </motion.div>

            {/* Section 6: Description */}
            <motion.div
              variants={fadeUp}
              className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm"
            >
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">
                  6
                </span>
                商品描述
              </h2>

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm resize-none"
                placeholder="请详细描述商品特点、面料手感、设计亮点等信息..."
              />
            </motion.div>

            {/* Submit */}
            <motion.div variants={fadeUp} className="flex justify-end gap-4">
              <Link
                href="/supplier"
                className="px-8 py-3.5 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                返回
              </Link>
              <button
                type="submit"
                className="px-10 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                提交商品
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.form>
        </div>
      </section>
    </>
  );
}
