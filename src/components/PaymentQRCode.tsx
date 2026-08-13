"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface Props {
  type: "wechat" | "alipay";
  className?: string;
}

export default function PaymentQRCode({ type, className = "" }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchQR = async () => {
      setLoading(true);
      setError(false);
      try {
        const key = type === "wechat" ? "pay_wechat_qr" : "pay_alipay_qr";
        const { data, error: err } = await supabase
          .from("site_assets")
          .select("image_url")
          .eq("key", key)
          .eq("is_active", true)
          .single();

        if (err || !data?.image_url) {
          setError(true);
        } else {
          setUrl(data.image_url);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchQR();
  }, [type]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-xl ${className}`}>
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !url) {
    const colorClass = type === "wechat" ? "bg-green-50 text-green-600 border-green-200" : "bg-blue-50 text-blue-600 border-blue-200";
    return (
      <div className={`flex items-center justify-center rounded-xl border-2 ${colorClass} ${className}`}>
        <p className="text-xs text-center px-3">
          📷<br/>请在管理后台<br/>「站点图片管理」<br/>上传{type === "wechat" ? "微信" : "支付宝"}收款码
        </p>
      </div>
    );
  }

  const borderColor = type === "wechat" ? "border-green-200" : "border-blue-200";

  return (
    <div className={`rounded-xl overflow-hidden border-2 shadow-sm ${borderColor} ${className}`}>
      <img
        src={url}
        alt={type === "wechat" ? "微信收款码" : "支付宝收款码"}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
