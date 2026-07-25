"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Heart, ShoppingBag, Trash2, Loader2, ArrowRight, LogIn,
} from "lucide-react";

interface WishItem {
  id: string;
  title: string;
  cover_image: string | null;
  price: number;
  wishlist_mode: boolean;
  is_published: boolean;
  created_at: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }: any) => {
      setUser(u || null);
      if (!u) { setLoading(false); return; }
      loadWishes(u);
    });
  }, []);

  const loadWishes = async (u: any) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setLoading(false); return; }
      const res = await fetch("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (j.success) setItems(j.items || []);
    } catch {
      /* 忽略 */
    } finally {
      setLoading(false);
    }
  };

  const removeWish = async (productId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    setRemoving(productId);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: productId, action: "remove" }),
      });
      const j = await res.json();
      if (j.success) setItems((prev) => prev.filter((i) => i.id !== productId));
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <LogIn className="w-7 h-7 text-primary" />
        </div>
        <div className="text-lg font-medium text-gray-700">请先登录</div>
        <p className="text-sm text-gray-400">登录后即可查看你加入心愿单的商品</p>
        <button
          onClick={() => router.push("/login?redirect=/wishlist")}
          className="px-8 py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition"
        >
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowRight className="w-5 h-5 text-gray-500 rotate-180" />
          </button>
          <span className="font-bold text-primary">我的心愿单</span>
          <span className="text-xs text-gray-400 ml-1">共 {items.length} 件</span>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <Heart className="w-7 h-7 text-amber-400" />
            </div>
            <div className="text-gray-500">还没有加入任何心愿商品</div>
            <p className="text-sm text-gray-400 max-w-xs">
              遇到没有标价但喜欢的款，点「加入心愿单」，集齐一定量我们就会去开价上架
            </p>
            <Link
              href="/buyer"
              className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition"
            >
              去逛逛 ›
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3"
              >
                <Link href={`/shop/${it.id}`} className="shrink-0">
                  <div className="w-20 h-20 rounded-xl bg-gray-50 overflow-hidden flex items-center justify-center">
                    {it.cover_image ? (
                      <img src={it.cover_image} alt={it.title} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-primary/30" />
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/${it.id}`}>
                    <div className="font-medium text-gray-900 line-clamp-2 text-sm">{it.title}</div>
                  </Link>
                  {it.wishlist_mode && (
                    <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                      价格待定 · 心愿收集
                    </span>
                  )}
                  {!it.is_published && (
                    <span className="inline-block mt-1.5 ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                      已下架
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeWish(it.id)}
                  disabled={removing === it.id}
                  className="shrink-0 p-2.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="移出心愿单"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
