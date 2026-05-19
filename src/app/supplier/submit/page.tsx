"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight, Home, Upload, X, CheckCircle2,
  ImageIcon, Package, Loader2, AlertCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_MAP, SUBCATEGORY_MAP, CATEGORIES } from "@/lib/categories";
import { ALL_STYLES } from "@/lib/styles";

/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  6大色系 */
const COLOR_FAMILIES = [
  { value: "deep",    label: "深色系", color: "#2C3E50", desc: "沉稳大气，气场感强" },
  { value: "light",   label: "浅色系", color: "#F5E6CC", desc: "清新柔和，轻盈优雅" },
  { value: "cool",    label: "冷色系", color: "#85CDCA", desc: "清冷知性，高级质感" },
  { value: "warm",    label: "暖色系", color: "#E8A87C", desc: "温暖明亮，活力亲和" },
  { value: "clear",   label: "净色系", color: "#E74C3C", desc: "鲜明纯粹，视觉冲击" },
  { value: "soft",    label: "柔色系", color: "#B39DBC", desc: "温柔内敛，低调雅致" },
];

/*  品类选项（从 CATEGORIES 派生） */
const CATEGORY_OPTIONS = CATEGORIES.map(c => ({ value: c.key, label: c.label }));

/*  商品属性选项 */
const fabricOptions   = ["棉","麻","丝","毛","涤纶","锦纶","混纺","羊绒","雪纺","真丝","牛仔","蕾丝","其他"];
const seasonOptions   = ["春","夏","秋","冬","四季"];
const occasionOptions = ["通勤","社交","休闲","运动","约会","度假"];
const fitOptions      = ["修身","直筒","宽松","A字","茧型","收腰"];
const sizeOptions     = ["XS","S","M","L","XL","XXL","XXXL","均码"];
const elasticityOptions = ["无弹","微弹","高弹"];
const thicknessOptions = ["薄款","适中","厚款"];
const liningOptions    = ["无里布","半里","全里"];

/* ==================== 类型 ==================== */
interface ColorDef { id: string; family: string; family_label: string; color_name: string; color_hex: string | null; }
interface StyleDef { id: string; group_label: string; style_name: string; }

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SupplierSubmitPage() {
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const supabase     = createClient();

  const [uploading, setUploading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast]     = useState(false);
  const [errors, setErrors]           = useState<Record<string,string>>({});

  /*  图片 { url, uploading } */
  const [images, setImages] = useState<{ url: string; uploading: boolean }[]>([]);

  /*  色彩定义（从数据库加载） */
  const [colorDefs, setColorDefs]             = useState<ColorDef[]>([]);
  const [loadingColors, setLoadingColors]   = useState(true);
  const [showAddColor, setShowAddColor]   = useState(false);
  const [addColorFamily, setAddColorFamily] = useState("");
  const [addColorName, setAddColorName]     = useState("");
  const [addColorHex, setAddColorHex]       = useState("");
  const [showAddFamily, setShowAddFamily]    = useState(false);
  const [addFamilyName, setAddFamilyName]   = useState("");
  const [addFamilyKey, setAddFamilyKey]     = useState("");
  const [addFamilyColor, setAddFamilyColor]  = useState("#999999");

  /*  风格定义（从数据库加载） */
  const [styleDefs, setStyleDefs]             = useState<StyleDef[]>([]);
  const [loadingStyles, setLoadingStyles]     = useState(true);
  const [showAddStyle, setShowAddStyle]     = useState(false);
  const [addStyleGroup, setAddStyleGroup]   = useState("");
  const [addStyleName, setAddStyleName]     = useState("");

  /*  品类定义（从数据库加载） */
  const [catDefs, setCatDefs] = useState<{id:string;code:string;label:string;description:string;sort_order:number}[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showAddCat, setShowAddCat] = useState(false);
  const [addCatCode, setAddCatCode] = useState("");
  const [addCatLabel, setAddCatLabel] = useState("");

  /*  表单 */
  const [form, setForm] = useState({
    title: "", productCode: "", brand: "",
    category: "", subcategory: "",
    colorFamily: "",   colorName: "",
    styleGroup: "",   styleName: "",
    wholesalePrice: "", retailPrice: "",
    stock: "",
    fabrics: [] as string[],  seasons: [] as string[],
    occasions: [] as string[], fits: [] as string[],
    sizes: [] as string[], elasticity: "", thickness: "", lining: "",
    weight: "", description: "",
    supplierName: "", supplierPhone: "", supplierWechat: "",
  });

  /* ========== 初始化加载 ========== */
  useEffect(() => {
    loadColorDefs();
    loadStyleDefs();
    loadCatDefs();
  }, []);

  const loadColorDefs = async () => {
    setLoadingColors(true);
    const { data } = await supabase.from("color_definitions").select("*").eq("is_active", true).order("sort_order");
    setColorDefs(data || []);
    setLoadingColors(false);
  };

  const loadStyleDefs = async () => {
    setLoadingStyles(true);
    const { data } = await supabase.from("style_definitions").select("*").eq("is_active", true).order("sort_order");
    setStyleDefs(data || []);
    setLoadingStyles(false);
  };

  const loadCatDefs = async () => {
    setLoadingCats(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCatDefs(data || []);
    setLoadingCats(false);
  };

  /* ========== 新增色彩 ========== */
  const saveNewColor = async () => {
    if (!addColorFamily || !addColorName.trim()) { alert("请选择色系并填写颜色名"); return; }
    const familyLabel = COLOR_FAMILIES.find(f => f.value === addColorFamily)?.label || addColorFamily;
    const { error } = await supabase.from("color_definitions").insert({
      family: addColorFamily, family_label: familyLabel,
      color_name: addColorName.trim(), color_hex: addColorHex || null,
      sort_order: 999,
    });
    if (error) { alert("保存失败：" + error.message); return; }
    setAddColorFamily(""); setAddColorName(""); setAddColorHex("");
    setShowAddColor(false);
    loadColorDefs();
  };

  /* ========== 新增风格 ========== */
  const saveNewStyle = async () => {
    if (!addStyleGroup || !addStyleName.trim()) { alert("请选择风格分组并填写风格名"); return; }
    const { error } = await supabase.from("style_definitions").insert({
      group_label: addStyleGroup, style_name: addStyleName.trim(), sort_order: 999,
    });
    if (error) { alert("保存失败：" + error.message); return; }
    setAddStyleGroup(""); setAddStyleName(""); setShowAddStyle(false);
    loadStyleDefs();
  };

  /* ========== 新增色系 ========== */
  const saveNewFamily = () => {
    if (!addFamilyKey.trim() || !addFamilyName.trim()) { alert("请填写色系编号和名称"); return; }
    const newFamily = { value: addFamilyKey.trim(), label: addFamilyName.trim(), color: addFamilyColor, desc: "" };
    COLOR_FAMILIES.push(newFamily);
    setAddFamilyKey(""); setAddFamilyName(""); setAddFamilyColor("#999999");
    setShowAddFamily(false);
  };

  /* ========== 新增品类 ========== */
  const saveNewCat = async () => {
    if (!addCatCode.trim() || !addCatLabel.trim()) { alert("请填写品类编号和名称"); return; }
    const { error } = await supabase.from("categories").insert({
      code: addCatCode.trim().toUpperCase(),
      label: addCatLabel.trim(),
      description: "",
      sort_order: catDefs.length + 1,
    });
    if (error) { alert("保存失败：" + error.message); return; }
    setAddCatCode(""); setAddCatLabel(""); setShowAddCat(false);
    loadCatDefs();
  };

  /* ========== 图片压缩 ========== */
  const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  /* ========== 图片上传 ========== */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 8 - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    const placeholders = toUpload.map(() => ({ url: "", uploading: true }));
    setImages(prev => [...prev, ...placeholders]);
    setUploading(true);

    const uploaded: { url: string; uploading: boolean }[] = [];
    for (const file of toUpload) {
      try {
        /* 如果图片超过 5MB，前端压缩后再上传 */
        let fileToUpload = file;
        if (file.size > 5 * 1024 * 1024) {
          fileToUpload = await compressImage(file, 1920, 0.85);
        }

        const ext  = fileToUpload.name.split(".").pop() || "jpg";
        const name = `supplier-${Date.now()}-${Math.random().toString(36).slice(2,6)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("supplier-products").upload(name, fileToUpload);
        if (upErr) {
          console.error("上传失败:", upErr.message);
          /* 如果 bucket 不存在或没权限，降级为本地预览 */
          const localUrl = URL.createObjectURL(file);
          uploaded.push({ url: localUrl, uploading: false });
        } else {
          const { data: { publicUrl } } = supabase.storage.from("supplier-products").getPublicUrl(name);
          uploaded.push({ url: publicUrl, uploading: false });
        }
      } catch (err: any) {
        console.error("图片处理失败:", err);
        /* 降级：用本地预览 */
        const localUrl = URL.createObjectURL(file);
        uploaded.push({ url: localUrl, uploading: false });
      }
    }

    setImages(prev => {
      let idx = prev.length - toUpload.length;
      const next = [...prev];
      for (const item of uploaded) {
        if (idx < next.length) { next[idx] = item; idx++; }
      }
      return next.filter(i => i.url !== "");
    });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  /* ========== 多选 toggle ========== */
  const toggleCheckbox = (
    field: "fabrics"|"seasons"|"occasions"|"fits"|"sizes",
    value: string
  ) => {
    setForm(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  /* ========== 校验 ========== */
  const validate = (): boolean => {
    const e: Record<string,string> = {};
    if (!form.title.trim())             e.title        = "请输入商品名称";
    if (images.filter(i => i.url).length === 0) e.images = "请至少上传1张商品图片";
    if (!form.category)              e.category     = "请选择商品品类";
    if (!form.colorFamily)            e.colorFamily  = "请选择色彩色系";
    if (!form.colorName)             e.colorName    = "请输入或选择具体颜色名";
    if (!form.styleGroup)             e.styleGroup   = "请选择风格分组";
    if (!form.styleName)              e.styleName    = "请输入或选择具体风格名";
    if (!form.wholesalePrice || Number(form.wholesalePrice) <= 0) e.wholesalePrice = "请输入批发价";
    if (!form.retailPrice     || Number(form.retailPrice)     <= 0) e.retailPrice     = "请输入零售价";
    if (Number(form.retailPrice) < Number(form.wholesalePrice)) e.retailPrice = "零售价不能低于批发价";
    if (!form.stock || Number(form.stock) < 0) e.stock = "请输入库存数量";
    if (!form.supplierName.trim())   e.supplierName = "请输入供应商名称";
    if (!form.supplierPhone.trim())  e.supplierPhone = "请输入联系方式";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ========== 提交 ========== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      const el = document.querySelector("[data-error]");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    try {
      const urls = images.filter(i => i.url).map(i => i.url);
      // 使用原生 fetch 直接调 Supabase REST API，绕过 JS 客户端的 schema cache 检查
      // （schema cache 可能未刷新，导致 "Could not find column" 错误）
      const rowData = {
        name:             form.title.trim(),           // name 列 NOT NULL，用 title 兜底
        title:            form.title.trim(),
        description:      form.description.trim() || null,
        product_code:     form.productCode.trim() || null,
        brand:            form.brand.trim()       || null,
        category:         form.category,
        subcategory:      form.subcategory       || null,
        color_season:     form.colorFamily,
        color_name:       form.colorName,
        style_type:       form.styleGroup,
        style_name:       form.styleName,
        price:            Math.round(Number(form.wholesalePrice) * 100),
        wholesale_price:  Math.round(Number(form.wholesalePrice) * 100),
        original_price:   Math.round(Number(form.retailPrice)     * 100),
        stock:            Number(form.stock),
        images:           urls,
        cover_image:      urls[0] || null,
        fabrics:          form.fabrics,
        seasons:          form.seasons,
        occasions:        form.occasions,
        fits:             form.fits,
        sizes:            form.sizes,
        elasticity:       form.elasticity     || null,
        thickness:        form.thickness      || null,
        lining:           form.lining         || null,
        weight:           form.weight.trim()  || null,
        supplier_name:    form.supplierName.trim(),
        supplier_phone:   form.supplierPhone.trim(),
        supplier_wechat:  form.supplierWechat.trim() || null,
        source:           "supplier_submit",
        is_published:     false,
        sort_order:       999,
        tags:             [],
      };

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const res = await fetch(`${supabaseUrl}/rest/v1/buyer_products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify(rowData),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `提交失败 (HTTP ${res.status})`);
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      setImages([]);
      setForm({ title:"", productCode:"", brand:"", category:"", subcategory:"",
                 colorFamily:"", colorName:"", styleGroup:"", styleName:"",
                 wholesalePrice:"", retailPrice:"", stock:"",
                 fabrics:[], seasons:[], occasions:[], fits:[], sizes:[],
                 elasticity:"", thickness:"", lining:"", weight:"", description:"",
                 supplierName:"", supplierPhone:"", supplierWechat:"" });
      setErrors({});
    } catch (err: any) {
      alert("提交失败：" + (err.message || "请重试"));
    } finally {
      setSubmitting(false);
    }
  };

  /* ========== 辅助 ========== */
  const getSubcategories = () => {
    if (!form.category) return [];
    const cat = CATEGORIES.find(c => c.key === form.category);
    return cat ? cat.subcategories : [];
  };

  const checkboxGroup = (label: string, field: "fabrics"|"seasons"|"occasions"|"fits"|"sizes", opts: string[]) =>
    <div>
      <label className="block text-sm font-medium text-primary mb-3">{label}</label>
      <div className="flex flex-wrap gap-2">
        {opts.map(o => (
          <button key={o} type="button" onClick={() => toggleCheckbox(field, o)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              form[field].includes(o) ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
            }`}>{o}</button>
        ))}
      </div>
    </div>;

  const radioGroup = (label: string, value: string, onChange: (v:string)=>void, opts: {value:string;label:string}[]) =>
    <div>
      <label className="block text-sm font-medium text-primary mb-3">{label}</label>
      <div className="flex flex-wrap gap-2">
        {opts.map(o => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              value === o.value ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
            }`}>{o.label}</button>
        ))}
      </div>
    </div>;

  const fieldError = (name: string) =>
    errors[name] ? (
      <p className="mt-1 text-xs text-red-500 flex items-center gap-1" data-error>
        <AlertCircle className="w-3 h-3" />{errors[name]}
      </p>
    ) : null;

  /* ========== 当前色系下的颜色选项 ========== */
  const colorOptionsForFamily = colorDefs.filter(c => c.family === form.colorFamily);

  /* ========== 当前分组下的风格选项 ========== */
  const styleOptionsForGroup = styleDefs.filter(s => s.group_label === form.styleGroup);
  const styleGroups = [...new Set(styleDefs.map(s => s.group_label))];

  /* ================================================================== */
  /*  RENDER                                                           */
  /* ================================================================== */
  return (
    <>
      {/* Toast */}
      {showToast && (
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}
          className="fixed top-20 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl shadow-2xl">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">商品提交成功！</p>
            <p className="text-sm text-white/80">审核通过后将展示在买手选品页面。</p>
          </div>
          <button onClick={()=>setShowToast(false)} className="ml-4 text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
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
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
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
          <motion.form onSubmit={handleSubmit} className="space-y-8"
            initial="hidden" animate="visible"
            variants={{ hidden:{}, visible:{ transition:{ staggerChildren:0.08 }}}}>

            {/* ─── Section 1: 基本信息 ─── */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">1</span>
                基本信息
              </h2>
              <div className="space-y-6">
                {/* 商品名称 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">商品名称 <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="如：桑蚕丝提花连衣裙 A2024" />
                  {fieldError("title")}
                </div>
                {/* 货号 + 品牌 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">货号/款号</label>
                    <input type="text" value={form.productCode} onChange={e=>setForm({...form,productCode:e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                      placeholder="如：A2024-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">品牌</label>
                    <input type="text" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                      placeholder="品牌名称（选填）" />
                  </div>
                </div>
                {/* 商品图片 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    商品图片 <span className="text-red-500">*</span>
                    <span className="text-xs text-muted-foreground ml-2">最多8张，第一张为封面图</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img,idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                        {img.uploading ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
                        ) : (
                          <>
                            <img src={img.url} alt={`商品图${idx+1}`} className="w-full h-full object-cover" />
                            {idx===0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[10px] text-center py-0.5">封面</span>}
                          </>
                        )}
                        <button type="button" onClick={()=>removeImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 8 && (
                      <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={uploading}
                        className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-accent/50 hover:bg-accent/5 transition-all disabled:opacity-50">
                        {uploading ? <Loader2 className="w-6 h-6 text-accent animate-spin" /> : <ImageIcon className="w-6 h-6 text-gray-400" />}
                        <span className="text-xs text-gray-400 mt-1">{uploading?"上传中":"添加"}</span>
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  {fieldError("images")}
                </div>
              </div>
            </motion.div>

            {/* ─── Section 2: 品类分类 ─── */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">2</span>
                品类分类
              </h2>
              <div className="space-y-6">
                {/* 主分类 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-primary">
                      商品品类 <span className="text-red-500">*</span>
                    </label>
                    <button type="button" onClick={()=>setShowAddCat(true)}
                      className="text-xs text-accent font-medium hover:underline flex items-center gap-1">
                      <span className="text-lg">+</span> 新增品类
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {loadingCats ? (
                      <span className="text-xs text-muted-foreground">加载中...</span>
                    ) : (
                      catDefs.map(cat => (
                        <button key={cat.id} type="button"
                          onClick={()=>setForm({...form,category:cat.code,subcategory:""})}
                          className={`px-5 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                            form.category===cat.code ? "bg-primary text-white border-primary shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
                          }`}>{cat.label}</button>
                      ))
                    )}
                  </div>
                  {fieldError("category")}
                </div>
                {/* 子分类 */}
                {form.category && getSubcategories().length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-primary mb-3">子品类</label>
                    <div className="flex flex-wrap gap-2">
                      {getSubcategories().map(sub => (
                        <button key={sub.key} type="button"
                          onClick={()=>setForm({...form,subcategory:sub.key})}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                            form.subcategory===sub.key ? "bg-accent text-white border-accent" : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
                          }`}>{sub.label}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ─── Section 3: 色彩分类（两级：色系→颜色名） ─── */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">3</span>
                色彩分类 <span className="text-red-500">*</span>
              </h2>

              {/* Step 1: 选色系 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-primary">选择色系</label>
                  <button type="button" onClick={()=>setShowAddFamily(true)}
                    className="text-xs text-accent font-medium hover:underline flex items-center gap-1">
                    <span className="text-lg">+</span> 新增色系
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COLOR_FAMILIES.map(fam => {
                    const familyColors = colorDefs.filter(c => c.family === fam.value);
                    return (
                      <div key={fam.value}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          form.colorFamily===fam.value ? "border-accent bg-accent/5 shadow-md" : "border-gray-200 hover:border-accent/30"
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                          <button type="button"
                            onClick={()=>setForm({...form,colorFamily:fam.value,colorName:""})}
                            className="flex items-center gap-3 flex-1 text-left">
                            <span className="w-8 h-8 rounded-full shrink-0 border border-white shadow-sm" style={{backgroundColor:fam.color}} />
                            <span className="font-bold text-primary">{fam.label}</span>
                          </button>
                          <button type="button" onClick={()=>{setAddColorFamily(fam.value);setShowAddColor(true)}}
                            className="text-xs text-accent hover:text-accent/70 font-medium flex items-center gap-0.5"
                            title={`在${fam.label}下新增颜色`}>
                            <span className="text-base leading-none">+</span>加色
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{fam.desc}</p>
                        {/* 色系下的颜色标签预览 */}
                        {!loadingColors && familyColors.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {familyColors.slice(0,6).map(c => (
                              <span key={c.id}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">
                                {c.color_hex && <span className="inline-block w-2 h-2 rounded-full" style={{backgroundColor:c.color_hex}} />}
                                {c.color_name}
                              </span>
                            ))}
                            {familyColors.length > 6 && (
                              <span className="text-[10px] text-muted-foreground">+{familyColors.length - 6}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {fieldError("colorFamily")}
              </div>

              {/* Step 2: 选/填具体颜色名 */}
              {form.colorFamily && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-primary">
                      具体颜色名（可多选，也可自行添加）
                    </label>
                    <button type="button" onClick={()=>{setAddColorFamily(form.colorFamily);setShowAddColor(true)}}
                      className="text-xs text-accent font-medium hover:underline flex items-center gap-1">
                      <span className="text-lg">+</span> 新增颜色
                    </button>
                  </div>
                  {loadingColors ? (
                    <div className="text-xs text-muted-foreground">加载中...</div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {colorOptionsForFamily.map(c => (
                          <button key={c.id} type="button"
                            onClick={()=>setForm({...form,colorName:c.color_name})}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              form.colorName===c.color_name
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
                            }`}>
                            {c.color_hex && <span className="inline-block w-3 h-3 rounded-full mr-1 align-middle" style={{backgroundColor:c.color_hex}} />}
                            {c.color_name}
                          </button>
                        ))}
                      </div>
                      {/* 自定义输入 */}
                      <div className="flex items-center gap-2">
                        <input type="text" value={form.colorName} onChange={e=>setForm({...form,colorName:e.target.value})}
                          placeholder="也可直接输入颜色名，如：橘红色"
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-accent outline-none text-sm" />
                      </div>
                    </>
                  )}
                  {fieldError("colorName")}
                </div>
              )}
            </motion.div>

            {/* ─── Section 4: 风格类型（两级：分组→风格名） ─── */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">4</span>
                风格类型 <span className="text-red-500">*</span>
              </h2>

              {/* Step 1: 选分组 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-primary">选择风格分组</label>
                  <button type="button" onClick={()=>{setAddStyleGroup("");setShowAddStyle(true)}}
                    className="text-xs text-accent font-medium hover:underline flex items-center gap-1">
                    <span className="text-lg">+</span> 新增分组
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {styleGroups.map(g => {
                    const groupStyles = styleDefs.filter(s => s.group_label === g);
                    return (
                      <div key={g}
                        className={`rounded-xl border-2 transition-all ${
                          form.styleGroup===g ? "border-primary bg-primary/5 shadow-md" : "border-gray-200 hover:border-accent/30"
                        }`}>
                        <div className="flex items-center">
                          <button type="button"
                            onClick={()=>setForm({...form,styleGroup:g,styleName:""})}
                            className={`px-5 py-3 text-sm font-medium rounded-l-xl ${
                              form.styleGroup===g ? "bg-primary text-white" : "text-gray-600"
                            }`}>{g}</button>
                          <button type="button" onClick={()=>{setAddStyleGroup(g);setShowAddStyle(true)}}
                            className="px-2 py-3 text-xs text-accent hover:text-accent/70 border-l border-gray-200"
                            title={`在${g}下新增风格`}>
                            +加风格
                          </button>
                        </div>
                        {/* 分组下的风格预览 */}
                        {!loadingStyles && groupStyles.length > 0 && (
                          <div className="px-3 pb-2 flex flex-wrap gap-1">
                            {groupStyles.slice(0,4).map(s => (
                              <span key={s.id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{s.style_name}</span>
                            ))}
                            {groupStyles.length > 4 && (
                              <span className="text-[10px] text-muted-foreground">+{groupStyles.length-4}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {fieldError("styleGroup")}
              </div>

              {/* Step 2: 选/填具体风格名 */}
              {form.styleGroup && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-primary">
                      具体风格名（可选已有，也可自行输入）
                    </label>
                    <button type="button" onClick={()=>{setAddStyleGroup(form.styleGroup);setShowAddStyle(true)}}
                      className="text-xs text-accent font-medium hover:underline flex items-center gap-1">
                      <span className="text-lg">+</span> 新增风格
                    </button>
                  </div>
                  {loadingStyles ? (
                    <div className="text-xs text-muted-foreground">加载中...</div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {styleOptionsForGroup.map(s => (
                          <button key={s.id} type="button"
                            onClick={()=>setForm({...form,styleName:s.style_name})}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              form.styleName===s.style_name
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-600 border-gray-200 hover:border-accent/50"
                            }`}>{s.style_name}</button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="text" value={form.styleName} onChange={e=>setForm({...form,styleName:e.target.value})}
                          placeholder="也可直接输入风格名，如：法式复古"
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-accent outline-none text-sm" />
                      </div>
                    </>
                  )}
                  {fieldError("styleName")}
                </div>
              )}
            </motion.div>

            {/* ─── Section 5: 价格与库存 ─── */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">5</span>
                价格与库存 <span className="text-red-500">*</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">批发价格 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                    <input type="number" required min="0" step="0.01" value={form.wholesalePrice}
                      onChange={e=>setForm({...form,wholesalePrice:e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm pl-8"
                      placeholder="0.00" />
                  </div>
                  {fieldError("wholesalePrice")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">零售价格 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                    <input type="number" required min="0" step="0.01" value={form.retailPrice}
                      onChange={e=>setForm({...form,retailPrice:e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm pl-8"
                      placeholder="0.00" />
                  </div>
                  {fieldError("retailPrice")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">库存数量 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="number" required min="0" step="1" value={form.stock}
                      onChange={e=>setForm({...form,stock:e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm pr-12"
                      placeholder="0" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">件</span>
                  </div>
                  {fieldError("stock")}
                </div>
              </div>
            </motion.div>

            {/* ─── Section 6: 商品属性 ─── */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">6</span>
                商品属性
              </h2>
              <div className="space-y-6">
                {checkboxGroup("面料成分", "fabrics", fabricOptions)}
                {checkboxGroup("适用季节", "seasons", seasonOptions)}
                {checkboxGroup("适用场合", "occasions", occasionOptions)}
                {checkboxGroup("版型", "fits", fitOptions)}
                {checkboxGroup("尺码范围", "sizes", sizeOptions)}
              </div>
            </motion.div>

            {/* ─── Section 7: 详细参数 ─── */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">7</span>
                详细参数
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {radioGroup("弹力", form.elasticity, v=>setForm({...form,elasticity:v}), elasticityOptions.map(o=>({value:o,label:o})))}
                {radioGroup("厚薄", form.thickness, v=>setForm({...form,thickness:v}), thicknessOptions.map(o=>({value:o,label:o})))}
                {radioGroup("里布", form.lining,  v=>setForm({...form,lining:v}),  liningOptions.map(o=>({value:o,label:o})))}
                <div>
                  <label className="block text-sm font-medium text-primary mb-3">克重</label>
                  <input type="text" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="如：200g/m²" />
                </div>
              </div>
            </motion.div>

            {/* ─── Section 8: 商品描述 ─── */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">8</span>
                商品描述
              </h2>
              <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                rows={6}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm resize-none"
                placeholder="请详细描述商品特点、面料手感、设计亮点、工艺细节等信息..." />
            </motion.div>

            {/* ─── Section 9: 供应商信息 ─── */}
            <motion.div variants={fadeUp} className="p-8 sm:p-10 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-8">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">9</span>
                供应商信息
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">供应商名称 <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.supplierName} onChange={e=>setForm({...form,supplierName:e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="公司或个人名称" />
                  {fieldError("supplierName")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">联系电话 <span className="text-red-500">*</span></label>
                  <input type="tel" required value={form.supplierPhone} onChange={e=>setForm({...form,supplierPhone:e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="手机号码" />
                  {fieldError("supplierPhone")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">微信号</label>
                  <input type="text" value={form.supplierWechat} onChange={e=>setForm({...form,supplierWechat:e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                    placeholder="选填" />
                </div>
              </div>
            </motion.div>

            {/* ─── 提交 ─── */}
            <motion.div variants={fadeUp} className="flex justify-end gap-4">
              <Link href="/supplier"
                className="px-8 py-3.5 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">返回</Link>
              <button type="submit" disabled={submitting || uploading}
                className="px-10 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60">
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />提交中...</> : <><CheckCircle2 className="w-5 h-5" />提交商品</>}
              </button>
            </motion.div>
          </motion.form>
        </div>
      </section>

      {/* ─── 新增颜色弹窗 ─── */}
      {showAddColor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowAddColor(false)} />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-primary mb-4">新增颜色</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">色系</label>
                <select value={addColorFamily} onChange={e=>setAddColorFamily(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                  <option value="">请选择色系</option>
                  {COLOR_FAMILIES.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">颜色名 *</label>
                <input type="text" value={addColorName} onChange={e=>setAddColorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent outline-none text-sm"
                  placeholder="如：橘红色" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">色值（选填）</label>
                <input type="color" value={addColorHex||"#000000"} onChange={e=>setAddColorHex(e.target.value)}
                  className="w-12 h-8 rounded border border-gray-200 cursor-pointer" />
                <input type="text" value={addColorHex} onChange={e=>setAddColorHex(e.target.value)}
                  className="ml-2 px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono w-24" placeholder="#FF4500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={()=>setShowAddColor(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm">取消</button>
              <button type="button" onClick={saveNewColor}
                className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 新增风格弹窗 ─── */}
      {showAddStyle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowAddStyle(false)} />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-primary mb-4">新增风格</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">风格分组</label>
                <input type="text" value={addStyleGroup} onChange={e=>setAddStyleGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent outline-none text-sm"
                  placeholder="如：女士风格 / 男士风格" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">风格名 *</label>
                <input type="text" value={addStyleName} onChange={e=>setAddStyleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent outline-none text-sm"
                  placeholder="如：法式复古" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={()=>setShowAddStyle(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm">取消</button>
              <button type="button" onClick={saveNewStyle}
                className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 新增色系弹窗 ─── */}
      {showAddFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowAddFamily(false)} />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-primary mb-4">新增色系</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">色系编号 *（英文，如 pastel）</label>
                <input type="text" value={addFamilyKey} onChange={e=>setAddFamilyKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent outline-none text-sm font-mono"
                  placeholder="如：pastel" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">色系名称 *（中文，如 马卡龙色系）</label>
                <input type="text" value={addFamilyName} onChange={e=>setAddFamilyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent outline-none text-sm"
                  placeholder="如：马卡龙色系" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">代表色</label>
                <input type="color" value={addFamilyColor} onChange={e=>setAddFamilyColor(e.target.value)}
                  className="w-12 h-8 rounded border border-gray-200 cursor-pointer" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={()=>setShowAddFamily(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm">取消</button>
              <button type="button" onClick={saveNewFamily}
                className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 新增品类弹窗 ─── */}
      {showAddCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowAddCat(false)} />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-primary mb-4">新增品类</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">品类编号 *（大写英文，如 SHOES）</label>
                <input type="text" value={addCatCode} onChange={e=>setAddCatCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g,''))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent outline-none text-sm font-mono"
                  placeholder="如：SHOES" maxLength={10} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">品类名称 *（中文，如 鞋靴）</label>
                <input type="text" value={addCatLabel} onChange={e=>setAddCatLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent outline-none text-sm"
                  placeholder="如：鞋靴" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={()=>setShowAddCat(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm">取消</button>
              <button type="button" onClick={saveNewCat}
                className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold">保存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
