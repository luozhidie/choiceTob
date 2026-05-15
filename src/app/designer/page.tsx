"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Palette, Users, CheckCircle2, Loader2 } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";

interface DesignerPackage {
  id: string;
  name: string;
  description: string;
  features: string;
  price_individual: number;
  price_group: number;
  image_url: string;
  is_published: boolean;
  sort_order: number;
}

export default function DesignerPage() {
  const [packages, setPackages] = useState<DesignerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<DesignerPackage | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("designer_packages")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (error) console.error(error);
      else setPackages(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handlePurchase = (pkg: DesignerPackage, type: "individual" | "group") => {
    setSelectedPkg(pkg);
    setShowPaywall(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-primary text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">原创设计</h1>
            <p className="text-base md:text-lg text-white/80 leading-relaxed">
              专业设计师团队为您量身定制，从品牌定位到款式开发一站式解决
            </p>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" /><p className="text-muted-foreground">加载中...</p></div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12"><p className="text-muted-foreground">暂无套餐</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg, i) => (
                <div key={pkg.id} className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border-2 ${i === 1 ? "border-accent relative" : "border-transparent"}`}>
                  {i === 1 && (
                    <div className="absolute top-0 left-0 right-0 bg-accent text-primary text-center text-sm font-bold py-1">推荐</div>
                  )}
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-accent" />
                      </div>
                      <h3 className="text-xl font-bold text-primary">{pkg.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>

                    {pkg.features && (
                      <ul className="space-y-2 mb-6">
                        {pkg.features.split("\n").filter(f => f.trim()).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            {feature.trim()}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="space-y-3">
                      <button
                        onClick={() => handlePurchase(pkg, "individual")}
                        className="w-full py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent/90 transition-colors"
                      >
                        个人 ¥{pkg.price_individual}
                      </button>
                      {pkg.price_group > 0 && (
                        <button
                          onClick={() => handlePurchase(pkg, "group")}
                          className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          团体 ¥{pkg.price_group}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          type="single"
          title={`购买"${selectedPkg?.name}"套餐`}
          description="联系客服完成购买后即可享受设计师服务"
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}
