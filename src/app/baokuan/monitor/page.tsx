"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, RefreshCw, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface MonitorItem {
  id: string;
  target_platform: string;
  target_url: string;
  target_name: string;
  is_active: boolean;
  last_check_at: string;
  alert_condition: any;
  created_at: string;
}

export default function MonitorPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [monitors, setMonitors] = useState<MonitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // 新增监控表单
  const [formData, setFormData] = useState({
    target_platform: "taobao",
    target_url: "",
    target_name: "",
    alert_price_change: true,
    alert_new_product: true,
    alert_stock_low: false,
  });

  useEffect(() => {
    checkAuth();
    fetchMonitors();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
    }
  };

  const fetchMonitors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("competitor_monitor")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching monitors:", error);
    } else {
      setMonitors(data || []);
    }
    setLoading(false);
  };

  const handleAddMonitor = async () => {
    if (!formData.target_url || !formData.target_name) {
      alert("请填写监控链接和名称");
      return;
    }

    const { error } = await supabase
      .from("competitor_monitor")
      .insert([{
        target_platform: formData.target_platform,
        target_url: formData.target_url,
        target_name: formData.target_name,
        alert_condition: {
          price_change: formData.alert_price_change,
          new_product: formData.alert_new_product,
          stock_low: formData.alert_stock_low,
        },
        is_active: true,
      }]);

    if (error) {
      alert("添加失败：" + error.message);
    } else {
      setShowAddModal(false);
      setFormData({
        target_platform: "taobao",
        target_url: "",
        target_name: "",
        alert_price_change: true,
        alert_new_product: true,
        alert_stock_low: false,
      });
      fetchMonitors();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个监控吗？")) return;
    
    const { error } = await supabase
      .from("competitor_monitor")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
    } else {
      fetchMonitors();
    }
  };

  const handleToggleActive = async (item: MonitorItem) => {
    const { error } = await supabase
      .from("competitor_monitor")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (error) {
      alert("操作失败：" + error.message);
    } else {
      fetchMonitors();
    }
  };

  const handleRefresh = async (id: string) => {
    // 模拟刷新监控数据
    await supabase
      .from("competitor_monitor")
      .update({ last_check_at: new Date().toISOString() })
      .eq("id", id);
    
    alert("监控数据已刷新");
    fetchMonitors();
  };

  const getPlatformLabel = (platform: string) => {
    const map: Record<string, string> = {
      "taobao": "淘宝",
      "1688": "1688",
      "douyin": "抖音",
      "xiaohongshu": "小红书",
    };
    return map[platform] || platform;
  };

  const getStatusBadge = (item: MonitorItem) => {
    if (!item.is_active) {
      return <span style={{ padding: "4px 8px", backgroundColor: "#f1f5f9", color: "#64748b", borderRadius: "4px", fontSize: "12px" }}>已暂停</span>;
    }
    if (!item.last_check_at) {
      return <span style={{ padding: "4px 8px", backgroundColor: "#fef3c7", color: "#92400e", borderRadius: "4px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}><Clock style={{ width: "12px", height: "12px" }} />待检查</span>;
    }
    return <span style={{ padding: "4px 8px", backgroundColor: "#d1fae5", color: "#065f46", borderRadius: "4px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle style={{ width: "12px", height: "12px" }} />监控中</span>;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* 顶部导航 */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>竞品监控</h1>
            <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>监控竞品价格、上新、库存变化</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus style={{ width: "18px", height: "18px" }} />
            添加监控
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white", borderRadius: "12px" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#94a3b8" }}>加载中...</p>
          </div>
        ) : monitors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white", borderRadius: "12px" }}>
            <TrendingUp style={{ width: "48px", height: "48px", color: "#cbd5e1", margin: "0 auto 16px" }} />
            <p style={{ color: "#94a3b8", marginBottom: "16px" }}>暂无监控数据，点击"添加监控"开始监控竞品</p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
            >
              添加监控
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>竞品名称</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>平台</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>状态</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>最后检查</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>预警设置</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontSize: "13px", fontWeight: "500", color: "#64748b" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {monitors.map((item) => (
                  <>
                    <tr 
                      key={item.id} 
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <td style={{ padding: "16px", fontWeight: "500", color: "#1e293b" }}>{item.target_name}</td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#64748b" }}>{getPlatformLabel(item.target_platform)}</td>
                      <td style={{ padding: "16px" }}>{getStatusBadge(item)}</td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#64748b" }}>
                        {item.last_check_at ? new Date(item.last_check_at).toLocaleString() : "未检查"}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {item.alert_condition?.price_change && <span style={{ padding: "2px 6px", backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: "3px", fontSize: "11px" }}>价格变动</span>}
                          {item.alert_condition?.new_product && <span style={{ padding: "2px 6px", backgroundColor: "#d1fae5", color: "#065f46", borderRadius: "3px", fontSize: "11px" }}>上新提醒</span>}
                          {item.alert_condition?.stock_low && <span style={{ padding: "2px 6px", backgroundColor: "#fef3c7", color: "#92400e", borderRadius: "3px", fontSize: "11px" }}>库存预警</span>}
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRefresh(item.id); }}
                            style={{ padding: "6px", backgroundColor: "transparent", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: "pointer" }}
                            title="刷新"
                          >
                            <RefreshCw style={{ width: "16px", height: "16px", color: "#64748b" }} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(item); }}
                            style={{ padding: "6px 12px", backgroundColor: item.is_active ? "#fef3c7" : "#d1fae5", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                          >
                            {item.is_active ? "暂停" : "启用"}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            style={{ padding: "6px", backgroundColor: "transparent", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer" }}
                            title="删除"
                          >
                            <Trash2 style={{ width: "16px", height: "16px", color: "#ef4444" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* 展开的详情区域 */}
                    {expandedId === item.id && (
                      <tr>
                        <td colSpan={6} style={{ padding: "0", backgroundColor: "#f8fafc" }}>
                          <div style={{ padding: "20px" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: "500", color: "#1e293b", marginBottom: "12px" }}>价格历史</h4>
                            <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                              {/* 模拟价格历史表格 */}
                              <table style={{ width: "100%", fontSize: "13px" }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ textAlign: "left", padding: "8px", color: "#64748b" }}>日期</th>
                                    <th style={{ textAlign: "right", padding: "8px", color: "#64748b" }}>价格</th>
                                    <th style={{ textAlign: "right", padding: "8px", color: "#64748b" }}>变动</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    { date: "2026-05-29", price: 199, change: "0" },
                                    { date: "2026-05-28", price: 199, change: "-10" },
                                    { date: "2026-05-27", price: 209, change: "0" },
                                    { date: "2026-05-26", price: 209, change: "+20" },
                                    { date: "2026-05-25", price: 189, change: "0" },
                                  ].map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                      <td style={{ padding: "8px", color: "#334155" }}>{row.date}</td>
                                      <td style={{ padding: "8px", textAlign: "right", color: "#334155" }}>¥{row.price}</td>
                                      <td style={{ padding: "8px", textAlign: "right", color: row.change === "0" ? "#64748b" : row.change.startsWith("+") ? "#ef4444" : "#10b981" }}>
                                        {row.change === "0" ? "-" : row.change.startsWith("+") ? `↑${row.change}` : `↓${row.change}`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <h4 style={{ fontSize: "14px", fontWeight: "500", color: "#1e293b", marginBottom: "12px" }}>上新记录</h4>
                            <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "16px" }}>
                              <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px", borderBottom: "1px solid #f1f5f9" }}>
                                <div style={{ width: "48px", height: "48px", backgroundColor: "#f1f5f9", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#94a3b8" }}>图片</div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: "14px", color: "#334155", marginBottom: "4px" }}>2026新款春装连衣裙</p>
                                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>上架时间：2026-05-28</p>
                                </div>
                                <span style={{ fontSize: "16px", fontWeight: "bold", color: "#3b82f6" }}>¥199</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 添加监控弹窗 */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: "0", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", maxWidth: "500px", width: "90%", maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b" }}>添加竞品监控</h2>
              <button onClick={() => setShowAddModal(false)} style={{ padding: "8px", backgroundColor: "transparent", border: "none", cursor: "pointer" }}>
                ✕
              </button>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#334155", marginBottom: "8px" }}>平台 *</label>
                <select 
                  value={formData.target_platform}
                  onChange={(e) => setFormData({ ...formData, target_platform: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px" }}
                >
                  <option value="taobao">淘宝</option>
                  <option value="1688">1688</option>
                  <option value="douyin">抖音</option>
                  <option value="xiaohongshu">小红书</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#334155", marginBottom: "8px" }}>竞品链接 *</label>
                <input 
                  type="text"
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  placeholder="粘贴竞品商品页链接"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#334155", marginBottom: "8px" }}>竞品名称 *</label>
                <input 
                  type="text"
                  value={formData.target_name}
                  onChange={(e) => setFormData({ ...formData, target_name: e.target.value })}
                  placeholder="给这个竞品起个名字（便于识别）"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px" }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#334155", marginBottom: "12px" }}>预警设置</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input 
                      type="checkbox"
                      checked={formData.alert_price_change}
                      onChange={(e) => setFormData({ ...formData, alert_price_change: e.target.checked })}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span style={{ fontSize: "14px", color: "#334155" }}>价格变动预警</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input 
                      type="checkbox"
                      checked={formData.alert_new_product}
                      onChange={(e) => setFormData({ ...formData, alert_new_product: e.target.checked })}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span style={{ fontSize: "14px", color: "#334155" }}>上新提醒</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input 
                      type="checkbox"
                      checked={formData.alert_stock_low}
                      onChange={(e) => setFormData({ ...formData, alert_stock_low: e.target.checked })}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span style={{ fontSize: "14px", color: "#334155" }}>库存预警</span>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button 
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 20px", backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                >
                  取消
                </button>
                <button 
                  onClick={handleAddMonitor}
                  style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
                >
                  添加监控
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
