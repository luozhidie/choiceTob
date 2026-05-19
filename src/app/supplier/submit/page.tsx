"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight, Home, Upload, X, CheckCircle2,
  ImageIcon, Package, Loader2, AlertCircle,
} from "lucide-react";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ALL_STYLES } from "@/lib/styles";
import { CATEGORY_MAP, SUBCATEGORY_MAP, CATEGORIES } from "@/lib/categories";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

/* 5大通俗色系 */
const COLOR_FAMILIES = [
  { value: "warm", label: "暖色系", color: "#E8A87C", desc: "温暖明亮，适合暖色调人群" },
  { value: "cool", label: "冷色系", color: "#85CDCA", desc: "清冷优雅，适合冷色调人群" },
  { value: "earth", label: "大地色系", color: "#C4A882", desc: "沉稳柔和，百搭不挑人" },
  { value: "deep", label: "深色系", color: "#2C3E50", desc: "深沉内敛，气场感强" },
  { value: "neutral", label: "中性色系", color: "#95A5A6", desc: "中性百搭，男女通用" },
];

/* 风格选项（通俗名） */
const STYLE_OPTIONS = ALL_STYLES.map(s => ({ value: s.value, label: s.label, group: s.group }));

/* 品类 + 子品类 */
const CATEGORY_OPTIONS = CATEGORIES.map(c => ({ value: c.key, label: c.label }));

/* 商品属性选项 */
const fabricOptions = ["棉", "麻", "丝", "毛", "涤纶", "锦纶", "混纺", "羊绒", "雪纺", "真丝", "牛仔", "蕾丝", "其他"];
const seasonOptions = ["春", "夏", "秋", "冬", "四季"];
const occasionOptions = ["通勤", "社交", "休闲", "运动", "约会", "度假"];
const fitOptions = ["修身", "直筒", "宽松", "A字", "茧型", "收腰"];
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "均码"];
const elasticityOptions = ["无弹", "微弹", "高弹"];
const thicknessOptions = ["薄款", "适中", "厚款"];
const liningOptions = ["无里布", "半里", "全里"];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SupplierSubmitPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* 图片列表：{ url: publicUrl, uploading: boolean } */
  const [images, setImages] = useState<{ url: string; uploading: boolean }[]>([]);

  const [form, setForm] = useState({
    title: "",
    productCode: "",
    brand: "",
    category: "",
    subcategory: "",
    colorSeason: "",
    styleType: "",
    wholesalePrice: "",
    retailPrice: "",
    stock: "",
    fabrics: [] as string[],
    seasons: [] as string[],
    occasions: [] as string[],
    fits: [] as string[],
    sizes: [] as string[],
    elasticity: "",
    thickness: "",
    lining: "",
    weight: "",
    description: "",
    supplierName: "",
    supplierPhone: "",
    supplierWechat: "",
  });

  /* ---- 图片上传 ---- */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = 8 - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    /* 先添加占位 */
    const placeholders = toUpload.map(() => ({ url: "", uploading: true }));
    setImages(prev => [...prev, ...placeholders]);
    setUploading(true);

    const uploaded: { url: string; uploading: boolean }[] = [];

    for (const file of toUpload) {
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `supplier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("supplier-products")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("supplier-products")
          .getPublicUrl(fileName);

        uploaded.push({ url: urlData.publicUrl, uploading: false });
      } catch (err) {
        console.error("图片上传失败:", err);
        uploaded.push({ url: "", uploading: false });
      }
    }

    setImages(prev => {
      /* 替换占位 */
      let idx = prev.length - toUpload.length;
      const newImages = [...prev];
      for (const item of uploaded) {
        if (idx < newImages.length) {
          newImages[idx] = item;
          idx++;
        }
      }
      /* 去掉上传失败的 */
      return newImages.filter(i => i.url !== "");
    });

    setUploading(false);
    /* 重置 file input */
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  /* ---- 多选 toggle ---- */
  const toggleCheckbox = (
    field: "fabrics" | "seasons" | "occasions" | "fits" | "sizes",
    value: string
  ) => {
    setForm(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  /* ---- 校验 ---- */
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "请输入商品名称";
    if (images.filter(i => i.url).length === 0) e.images = "请至少上传1张商品图片";
    if (!form.category) e.category = "请选择商品品类";
    if (!form.colorSeason) e.colorSeason = "请选择色彩季型";
    if (!form.styleType) e.styleType = "请选择风格类型";
    if (!form.wholesalePrice || Number(form.wholesalePrice) <= 0) e.wholesalePrice = "请输入批发价";
    if (!form.retailPrice || Number(form.retailPrice) <= 0) e.retailPrice = "请输入零售价";
    if (Number(form.retailPrice) < Number(form.wholesalePrice)) e.retailPrice = "零售价不能低于批发价";
    if (!form.stock || Number(form.stock) < 0) e.stock = "请输入库存数量";
    if (!form.supplierName.trim()) e.supplierName = "请输入供应商名称";
    if (!form.supplierPhone.trim()) e.supplierPhone = "请输入联系方式";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---- 提交 ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      /* 滚动到第一个错误 */
      const firstErr = document.querySelector("[data-error]");
      firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const imageUrls = images.filter(i => i.url).map(i => i.url);
      const coverImage = imageUrls[0] || "";

      const { error } = await supabase.from("buyer_products").insert([{
        title: form.title.trim(),
        description: form.description.trim() || null,
        product_code: form.productCode.trim() || null,
        brand: form.brand.trim() || null,
        category: form.category,
        subcategory: form.subcategory || null,
        color_season: form.colorSeason,
        style_type: form.styleType,
        price: Math.round(Number(form.wholesalePrice) * 100),  // 批发价存为 price（分）
        wholesale_price: Math.round(Number(form.wholesalePrice) * 100),
        original_price: Math.round(Number(form.retailPrice) * 100),
        stock: Number(form.stock),
        images: imageUrls,
        cover_image: coverImage,
        fabrics: form.fabrics,
        seasons: form.seasons,
        occasions: form.occasions,
        fits: form.fits,
        sizes: form.sizes,
        elasticity: form.elasticity || null,
        thickness: form.thickness || null,
        lining: form.lining || null,
        weight: form.weight.trim() || null,
        supplier_name: form.supplierName.trim(),
        supplier_phone: form.supplierPhone.trim(),
        supplier_wechat: form.supplierWechat.trim() || null,
        source: "supplier_submit",
        is_published: false,  // 需后台审核
        sort_order: 999,
        tags: [],
      }]);

      if (error) throw error;

      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      /* 清空表单 */
      setImages([]);
      setForm({
        title: "", productCode: "", brand: "", category: "", subcategory: "",
        colorSeason: "", styleType: "", wholesalePrice: "", retailPrice: "",
        stock: "", fabrics: [], seasons: [], occasions: [], fits: [], sizes: [],
        elasticity: "", thickness: "", lining: "", weight: "", description: "",
        supplierName: "", supplierPhone: "", supplierWechat: "",
      });
      setErrors({});
    } catch (err: any) {
      console.error("提交失败:", err);
      alert("提交失败，请重试或联系客服");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- 获取子品类选项 ---- */
  const getSubcategories = () => {
    if (!form.category) return [];
    const cat = CATEGORIES.find(c => c.key === form.category);
    return cat ? cat.subcategories : [];
  };

  /* ---- 通用多选组件 ---- */
  const CheckboxGroup = ({ label, field, options }: {
    label: string;
    field: "fabrics" | "seasons" | "occasions" | "fits" | "sizes";
    options: string[];
  }) => (
    <div>
      <label className="block text-sm font-medium text-primary mb-3">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => toggleCheckbox(field, opt)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              form[field].includes(opt)
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
            }`}
          >{opt}</button>
        ))}
      </div>
    </div>
  );

  /* ---- 单选按钮组 ---- */
  const RadioGroup = ({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div>
      <label className="block text-sm font-medium text-primary mb-3">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              value === opt.value
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
            }`}
          >{opt.label}</button>
        ))}
      </div>
    </div>
  );

  /* ---- 错误提示 ---- */
  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="mt-1 text-xs text-red-500 flex items-center gap-1" data-error>
        <AlertCircle className="w-3 h-3" />{errors[name]}
      </p>
    ) : null;

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
              您的商品已进入审核流程，审核通过后将在买手选品页面展示。
            </p>
          </div>
          <button onClick={() => setShowToast(false)} className="ml-4 text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Breadcrumb */}
      <div className="bg-muted border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors"><Home className="w-4 h-4" /></Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/supplier" className="hover:text-primary transition-colors">一手货源</Link>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <Package className="w-4 h-4" /> 商品提交
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold">提交商品信息</h1>
            <p className="mt-3 text-white/70 max-w-xl leading-relaxed">
              完整填写商品信息，审核通过后将展示在买手选品页面。带 <span className="text-red-300">*</span> 为必填项。
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
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >

            {/* ====== Section 1: 基本信息 ====== */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">1</span>
                基本信息
              </h2>
              <div className="space-y-6">
                {/* 商品名称 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    商品名称 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="如：桑蚕丝提花连衣裙 A2024"
                  />
                  <FieldError name="title" />
                </div>

                {/* 货号 + 品牌 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">货号/款号</label>
                    <input type="text" value={form.productCode}
                      onChange={e => setForm({ ...form, productCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                      placeholder="如：A2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">品牌</label>
                    <input type="text" value={form.brand}
                      onChange={e => setForm({ ...form, brand: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                      placeholder="品牌名称（选填）"
                    />
                  </div>
                </div>

                {/* 商品图片 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    商品图片 <span className="text-red-500">*</span>
                    <span className="text-xs text-muted-foreground ml-2">最多8张，第一张为封面图</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                        {img.uploading ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Loader2 className="w-6 h-6 animate-spin text-accent" />
                          </div>
                        ) : (
                          <>
                            <img src={img.url} alt={`商品图${idx + 1}`} className="w-full h-full object-cover" />
                            {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[10px] text-center py-0.5">封面</span>}
                          </>
                        )}
                        <button type="button" onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 8 && (
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                        className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-accent/50 hover:bg-accent/5 transition-all disabled:opacity-50"
                      >
                        {uploading ? <Loader2 className="w-6 h-6 text-accent animate-spin" /> : <ImageIcon className="w-6 h-6 text-gray-400" />}
                        <span className="text-xs text-gray-400 mt-1">{uploading ? "上传中" : "添加"}</span>
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  <FieldError name="images" />
                </div>
              </div>
            </motion.div>

            {/* ====== Section 2: 品类分类 ====== */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">2</span>
                品类分类
              </h2>
              <div className="space-y-6">
                {/* 品类 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-3">
                    商品品类 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {CATEGORY_OPTIONS.map(cat => (
                      <button key={cat.value} type="button"
                        onClick={() => setForm({ ...form, category: cat.value, subcategory: "" })}
                        className={`px-5 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                          form.category === cat.value
                            ? "bg-primary text-white border-primary shadow-md"
                            : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
                        }`}
                      >{cat.label}</button>
                    ))}
                  </div>
                  <FieldError name="category" />
                </div>

                {/* 子品类 */}
                {form.category && getSubcategories().length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-primary mb-3">子品类</label>
                    <div className="flex flex-wrap gap-2">
                      {getSubcategories().map(sub => (
                        <button key={sub.key} type="button"
                          onClick={() => setForm({ ...form, subcategory: sub.key })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                            form.subcategory === sub.key
                              ? "bg-accent text-white border-accent"
                              : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
                          }`}
                        >{sub.label}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ====== Section 3: 色彩季型（通俗色系）====== */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">3</span>
                色彩季型 <span className="text-red-500">*</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {COLOR_FAMILIES.map(family => (
                  <button key={family.value} type="button"
                    onClick={() => setForm({ ...form, colorSeason: family.value })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      form.colorSeason === family.value
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-gray-200 hover:border-accent/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-full shrink-0 border border-white shadow-sm"
                        style={{ backgroundColor: family.color }} />
                      <span className="font-bold text-primary">{family.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{family.desc}</p>
                  </button>
                ))}
              </div>
              <FieldError name="colorSeason" />
              {form.colorSeason && (
                <div className="mt-4 p-3 bg-accent/5 rounded-lg border border-accent/20 flex items-center gap-2">
                  <span className="text-sm text-accent font-medium">已选择：{COLOR_FAMILIES.find(f => f.value === form.colorSeason)?.label}</span>
                </div>
              )}
            </motion.div>

            {/* ====== Section 4: 风格类型 ====== */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">4</span>
                风格类型 <span className="text-red-500">*</span>
              </h2>
              {/* 女士 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">女士风格</h3>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.filter(s => s.group === "女士八大风格").map(style => (
                    <button key={style.value} type="button"
                      onClick={() => setForm({ ...form, styleType: style.value })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.styleType === style.value
                          ? "bg-primary text-white border-primary shadow-md"
                          : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
                      }`}
                    >{style.label}</button>
                  ))}
                </div>
              </div>
              {/* 男士 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">男士风格</h3>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.filter(s => s.group === "男士五大风格").map(style => (
                    <button key={style.value} type="button"
                      onClick={() => setForm({ ...form, styleType: style.value })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.styleType === style.value
                          ? "bg-primary text-white border-primary shadow-md"
                          : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
                      }`}
                    >{style.label}</button>
                  ))}
                </div>
              </div>
              <FieldError name="styleType" />
            </motion.div>

            {/* ====== Section 5: 价格与库存 ====== */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">5</span>
                价格与库存 <span className="text-red-500">*</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    批发价格 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                    <input type="number" required min="0" step="0.01" value={form.wholesalePrice}
                      onChange={e => setForm({ ...form, wholesalePrice: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm pl-8"
                      placeholder="0.00"
                    />
                  </div>
                  <FieldError name="wholesalePrice" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    零售价格 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                    <input type="number" required min="0" step="0.01" value={form.retailPrice}
                      onChange={e => setForm({ ...form, retailPrice: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm pl-8"
                      placeholder="0.00"
                    />
                  </div>
                  <FieldError name="retailPrice" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    库存数量 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input type="number" required min="0" step="1" value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm pr-12"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">件</span>
                  </div>
                  <FieldError name="stock" />
                </div>
              </div>
            </motion.div>

            {/* ====== Section 6: 商品属性 ====== */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">6</span>
                商品属性
              </h2>
              <div className="space-y-6">
                <CheckboxGroup label="面料成分" field="fabrics" options={fabricOptions} />
                <CheckboxGroup label="适用季节" field="seasons" options={seasonOptions} />
                <CheckboxGroup label="适用场合" field="occasions" options={occasionOptions} />
                <CheckboxGroup label="版型" field="fits" options={fitOptions} />
                <CheckboxGroup label="尺码范围" field="sizes" options={sizeOptions} />
              </div>
            </motion.div>

            {/* ====== Section 7: 详细参数 ====== */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">7</span>
                详细参数
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <RadioGroup label="弹力" value={form.elasticity} onChange={v => setForm({ ...form, elasticity: v })}
                  options={elasticityOptions.map(o => ({ value: o, label: o }))} />
                <RadioGroup label="厚薄" value={form.thickness} onChange={v => setForm({ ...form, thickness: v })}
                  options={thicknessOptions.map(o => ({ value: o, label: o }))} />
                <RadioGroup label="里布" value={form.lining} onChange={v => setForm({ ...form, lining: v })}
                  options={liningOptions.map(o => ({ value: o, label: o }))} />
                <div>
                  <label className="block text-sm font-medium text-primary mb-3">克重</label>
                  <input type="text" value={form.weight}
                    onChange={e => setForm({ ...form, weight: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="如：200g/m²"
                  />
                </div>
              </div>
            </motion.div>

            {/* ====== Section 8: 商品描述 ====== */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">8</span>
                商品描述
              </h2>
              <textarea value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm resize-none"
                placeholder="请详细描述商品特点、面料手感、设计亮点、工艺细节等信息..."
              />
            </motion.div>

            {/* ====== Section 9: 供应商信息 ====== */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">9</span>
                供应商信息
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    供应商名称 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={form.supplierName}
                    onChange={e => setForm({ ...form, supplierName: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="公司或个人名称"
                  />
                  <FieldError name="supplierName" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <input type="tel" required value={form.supplierPhone}
                    onChange={e => setForm({ ...form, supplierPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="手机号码"
                  />
                  <FieldError name="supplierPhone" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">微信号</label>
                  <input type="text" value={form.supplierWechat}
                    onChange={e => setForm({ ...form, supplierWechat: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="选填"
                  />
                </div>
              </div>
            </motion.div>

            {/* ====== 提交 ====== */}
            <motion.div variants={fadeUp} className="flex justify-end gap-4">
              <Link href="/supplier"
                className="px-8 py-3.5 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >返回</Link>
              <button type="submit" disabled={submitting || uploading}
                className="px-10 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />提交中...</>
                ) : (
                  <>提交商品 <CheckCircle2 className="w-5 h-5" /></>
                )}
              </button>
            </motion.div>
          </motion.form>
        </div>
      </section>
    </>
  );
}
