"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Play, Lock, Unlock, Loader2 } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";

interface Course {
  id: string;
  title: string;
  description: string;
  video_url: string;
  cover_url: string;
  price: number;
  is_published: boolean;
  created_at: string;
}

export default function EducationPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching courses:", error);
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleCourseClick = (course: Course) => {
    if (course.price > 0) {
      // 付费课程，显示付费墙
      setSelectedCourse(course);
      setShowPaywall(true);
    } else {
      // 免费课程，直接播放
      setSelectedCourse(course);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-primary text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              教学中心
            </h1>
            <p className="text-base md:text-lg text-white/80 leading-relaxed mb-6">
              专业服装行业教学视频，从入门到精通
            </p>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无课程</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Course Cover */}
                  <div className="relative aspect-video bg-gray-100">
                    {course.cover_url ? (
                      <img
                        src={course.cover_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent/10">
                        <Play className="w-12 h-12 text-accent/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-primary ml-1" />
                      </div>
                    </div>
                    {course.price > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                          <Lock className="w-3 h-3" />
                          付费
                        </span>
                      </div>
                    )}
                    {course.price === 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                          <Unlock className="w-3 h-3" />
                          免费
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-primary mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(course.created_at).toLocaleDateString("zh-CN")}
                      </span>
                      {course.price > 0 ? (
                        <span className="text-lg font-bold text-accent">
                          ¥{(course.price / 100).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-green-600">
                          会员免费
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Video Player Modal */}
      {selectedCourse && !selectedCourse.price && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-primary">{selectedCourse.title}</h2>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={selectedCourse.video_url}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          type="course"
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}
