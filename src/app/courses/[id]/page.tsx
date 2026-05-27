"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Lock, ArrowLeft, Clock, BookOpen, CheckCircle2, X, ShoppingBag, CreditCard, Play, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  is_free: boolean;
  category: string | null;
  level: string;
  duration_minutes: number | null;
  video_url: string | null;
  content: string | null;
  is_published: boolean;
}

const categoryMap: Record<string, string> = {
  cmb_color: "CMB色彩诊断",
  styling: "搭配技巧",
  wardrobe: "衣橱管理",
  image: "形象提升",
};

const levelMap: Record<string, string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高级",
};

export default function CourseDetailPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payStep, setPayStep] = useState<"confirm" | "paying" | "success">("confirm");
  const [visible, setVisible] = useState(false);
  const [copiedWechat, setCopiedWechat] = useState(false);
  const [copiedAlipay, setCopiedAlipay] = useState(false);
  const autoPayShown = useRef(false);

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const courseId = params?.id as string;

  useEffect(() => {
    setVisible(true);
    if (courseId) fetchCourse(courseId);
  }, [courseId]);

  const fetchCourse = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        console.error("课程查询失败:", error);
        router.push("/courses");
        return;
      }
      setCourse(data as Course);
    } catch (err) {
      console.error("获取课程异常:", err);
      router.push("/courses");
    }
    setLoading(false);

    // Check if user has purchased via course_purchases table
    if (user && !data.is_free) {
      const { data: purchaseData } = await supabase
        .from("course_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", id)
        .eq("status", "paid")
        .maybeSingle();
      if (purchaseData) setPurchased(true);
    }
  };

  // Re-check purchase when auth loads
  useEffect(() => {
    if (!authLoading && user && courseId && course && !course.is_free && !purchased) {
      const checkPurchase = async () => {
        const { data } = await supabase
          .from("course_purchases")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .eq("status", "paid")
          .maybeSingle();
        if (data) setPurchased(true);
      };
      checkPurchase();
    }
  }, [authLoading, user, courseId, course, purchased]);

  // 自动弹出购买弹窗：付费课程 + 未购买 + 已登录 + 页面加载完成
  useEffect(() => {
    if (!loading && !authLoading && course && !course.is_free && !purchased && user && !autoPayShown.current) {
      const timer = setTimeout(() => {
        setShowPayModal(true);
        setPayStep("confirm");
        autoPayShown.current = true;
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [loading, authLoading, course, purchased, user]);

  const handlePurchaseClick = async () => {
    if (!user) {
      router.push(`/login?redirect=/courses/${courseId}`);
      return;
    }
    setShowPayModal(true);
    setPayStep("confirm");
  };

  const handleConfirmPay = async () => {
    setPayStep("paying");
    // Record purchase in course_purchases table
    if (!course || !user) return;
    try {
      const { error } = await supabase.from("course_purchases").insert([
        {
          user_id: user.id,
          course_id: course.id,
          price: course.price,
          status: "paid",
        },
      ]);
      if (error) {
        // Duplicate purchase - already bought
        if (error.code === "23505") {
          setPurchased(true);
          setShowPayModal(false);
          return;
        }
        console.error("购买记录创建失败:", error);
      } else {
        setPurchased(true);
        // 购买成功后自动关闭弹窗并刷新页面
        setTimeout(() => {
          setShowPayModal(false);
          setPayStep("confirm");
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error("购买错误:", err);
    }
    setPayStep("success");
  };

  const handleClosePayModal = () => {
    setShowPayModal(false);
    setPayStep("confirm");
  };

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const canWatch = course.is_free || purchased;
  const priceYuan = (course.price / 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <Link href="/courses" className="hover:text-primary">线上课程</Link>
            <span>/</span>
            <span className="text-primary font-medium">{course.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-12 md:py-16">
        <div className={`container mx-auto px-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-3">
              {course.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {categoryMap[course.category] || course.category}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                {levelMap[course.level] || course.level}
              </span>
              {!course.is_free && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/80 text-white font-semibold">
                  付费课程
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-sm md:text-base text-white/80 max-w-2xl">
                {course.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
              {course.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.floor(course.duration_minutes / 60)}小时{course.duration_minutes % 60}分
                </span>
              )}
              <span className={`font-bold text-lg ${course.is_free ? "text-green-300" : "text-accent"}`}>
                {course.is_free ? "免费" : `¥${priceYuan}`}
              </span>
              {purchased && !course.is_free && (
                <span className="flex items-center gap-1 text-green-300">
                  <CheckCircle2 className="w-4 h-4" />
                  已购买
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Video + Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Video Area */}
          {canWatch && course.video_url ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 rounded-2xl overflow-hidden bg-black aspect-video"
            >
              <video
                src={course.video_url}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full"
                onError={(e) => console.warn("视频加载失败:", course.video_url)}
              />
            </motion.div>
          ) : !canWatch ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              {/* Blurred preview */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-primary/10 to-accent/10">
                {course.video_url ? (
                  <>
                    <video
                      src={course.video_url}
                      className="w-full h-full object-cover blur-lg scale-105"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 border-2 border-white/40">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-white font-semibold text-lg mb-1">付费课程</p>
                        <p className="text-white/70 text-sm mb-5">购买后即可观看完整课程视频</p>
                        <button
                          onClick={handlePurchaseClick}
                          className="btn-accent inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                          <CreditCard className="w-4 h-4" />
                          立即购买 ¥{priceYuan}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-primary/30" />
                      </div>
                      <p className="text-muted-foreground text-sm">视频准备中</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick purchase bar */}
              <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-bold text-primary text-lg">¥{priceYuan}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">购买后永久有效，无限次观看</p>
                </div>
                <div className="flex items-center gap-3">
                  {!user && (
                    <Link
                      href={`/login?redirect=/courses/${courseId}`}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      登录后购买
                    </Link>
                  )}
                  <button
                    onClick={handlePurchaseClick}
                    className="btn-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    立即购买
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="mb-10 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center aspect-video">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">课程视频暂未上传</p>
              </div>
            </div>
          )}

          {/* Course Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2">
              {course.content && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
                >
                  <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    课程介绍
                  </h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                    {course.content}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                <h3 className="font-bold text-primary mb-4">课程信息</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">分类</span>
                    <span className="font-medium text-primary">
                      {course.category ? (categoryMap[course.category] || course.category) : "未分类"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">难度</span>
                    <span className="font-medium text-primary">
                      {levelMap[course.level] || course.level}
                    </span>
                  </div>
                  {course.duration_minutes && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">时长</span>
                      <span className="font-medium text-primary">
                        {Math.floor(course.duration_minutes / 60)}小时{course.duration_minutes % 60}分
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">价格</span>
                    <span className={`font-bold ${course.is_free ? "text-green-500" : "text-accent"}`}>
                      {course.is_free ? "免费" : `¥${priceYuan}`}
                    </span>
                  </div>
                  {!course.is_free && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">状态</span>
                      <span className={`font-medium ${purchased ? "text-green-500" : "text-amber-500"}`}>
                        {purchased ? "已购买" : "未购买"}
                      </span>
                    </div>
                  )}
                </div>

                {!canWatch && (
                  <button
                    onClick={handlePurchaseClick}
                    className="w-full mt-5 btn-accent py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    立即购买 ¥{priceYuan}
                  </button>
                )}
                {canWatch && !course.is_free && (
                  <div className="mt-5 p-3 rounded-xl bg-green-50 text-green-600 text-center text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                    已解锁，可观看
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Payment Modal */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleClosePayModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={handleClosePayModal}
                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Step 1: Confirm */}
              {payStep === "confirm" && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">确认购买课程</h3>
                    <p className="mt-2 text-sm text-muted-foreground">购买后可无限次观看</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                      {course.cover_image ? (
                        <img src={course.cover_image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-primary truncate">{course.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {course.category && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {categoryMap[course.category]}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {levelMap[course.level]}
                          </span>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-accent shrink-0">¥{priceYuan}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {[
                      "购买后永久有效，不限观看次数",
                      "支持手机、平板、电脑多端观看",
                      "课程内容持续更新",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleClosePayModal}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmPay}
                      className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors shadow-md"
                    >
                      确认购买
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Paying */}
              {payStep === "paying" && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-accent border-t-transparent mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">正在处理购买...</p>
                </div>
              )}

              {/* Step 3: Success */}
              {payStep === "success" && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">购买成功！</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    课程已解锁，现在可以观看完整内容了
                  </p>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => {
                        setShowPayModal(false);
                        setPurchased(true);
                      }}
                      className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      开始观看
                    </button>
                    <Link
                      href="/courses"
                      className="block w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-center"
                    >
                      返回课程列表
                    </Link>
                  </div>

                  {/* Offline payment info */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-3">
                      如需线下支付/对公转账，请联系客服
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-50 rounded-lg p-3 text-left border border-green-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs">💬</span>
                          <span className="text-xs font-bold text-green-700">微信</span>
                        </div>
                        <p className="text-[11px] text-green-600 font-mono">luozhidie666</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("luozhidie666");
                            setCopiedWechat(true);
                            setTimeout(() => setCopiedWechat(false), 2000);
                          }}
                          className="mt-1 text-[10px] px-2 py-0.5 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          {copiedWechat ? "已复制" : "复制"}
                        </button>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-left border border-blue-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs">💙</span>
                          <span className="text-xs font-bold text-blue-700">支付宝</span>
                        </div>
                        <p className="text-[11px] text-blue-600 font-mono">13925997776</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("13925997776");
                            setCopiedAlipay(true);
                            setTimeout(() => setCopiedAlipay(false), 2000);
                          }}
                          className="mt-1 text-[10px] px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          {copiedAlipay ? "已复制" : "复制"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
