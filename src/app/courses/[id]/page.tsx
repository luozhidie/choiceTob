"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, Clock, BookOpen, CheckCircle2 } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";
import { motion } from "framer-motion";

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
  const [showPaywall, setShowPaywall] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const courseId = pathname.split("/").pop();

  useEffect(() => {
    setVisible(true);
    if (courseId) fetchCourse(courseId);
  }, [courseId]);

  const fetchCourse = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      router.push("/courses");
      return;
    }
    setCourse(data as Course);
    setLoading(false);

    // Check if user has purchased
    const { data: { user } } = await supabase.auth.getUser();
    if (user && !data.is_free) {
      const { data: orderData } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_phone", user.email)
        .eq("service_type", "course")
        .eq("title", data.title)
        .eq("status", "paid")
        .maybeSingle();
      if (orderData) setPurchased(true);
    }
  };

  const handlePurchase = async () => {
    if (!course) return;
    // This would be called after PaywallModal submits successfully
    // For now, just show the paywall
    setShowPaywall(true);
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const canWatch = course.is_free || purchased;

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
              <span className={`font-bold ${course.is_free ? "text-green-300" : "text-accent"}`}>
                {course.is_free ? "免费" : `¥${(course.price / 100).toFixed(0)}`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Video + Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Video */}
          {canWatch && course.video_url ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center"
            >
              <video
                src={course.video_url}
                controls
                className="w-full h-full"
              />
            </motion.div>
          ) : !canWatch ? (
            <div className="mb-10 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center aspect-video">
              <div className="text-center">
                <Lock className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">购买后即可观看完整课程</p>
                <button
                  onClick={() => setShowPaywall(true)}
                  className="mt-4 btn-accent px-6 py-2.5 rounded-xl text-sm font-semibold"
                >
                  立即购买 ¥{(course.price / 100).toFixed(0)}
                </button>
              </div>
            </div>
          ) : null}

          {/* Content */}
          {course.content && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 prose prose-sm max-w-none"
            >
              <h2 className="text-xl font-bold text-primary mb-4">课程介绍</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {course.content}
              </div>
            </motion.div>
          )}

          {/* Purchase CTA */}
          {!canWatch && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowPaywall(true)}
                className="btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <BookOpen className="w-5 h-5" />
                立即购买 ¥{(course.price / 100).toFixed(0)}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                支付安全便捷，购买后永久有效
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          type="course"
          title={course.title}
          description={`¥${(course.price / 100).toFixed(0)} - 购买后即可观看完整课程`}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}
