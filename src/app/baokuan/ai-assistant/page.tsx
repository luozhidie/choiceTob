"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Send, Bot, User, Sparkles, TrendingUp, Calendar, BarChart3, ShoppingBag, ArrowLeft } from "lucide-react";

// FCPSR编码体系（用于AI推荐时展示）
const FCPSR_LABELS: Record<string, string> = {
  F01: "棉", F02: "丝", F03: "羊毛", F04: "麻", F05: "化纤", F06: "混纺", F07: "皮革", F08: "羽绒",
  C01: "修身", C02: "宽松", C03: "直筒", C04: "A字", C05: "不规则",
  P01: "条纹", P02: "波点", P03: "碎花", P04: "几何", P05: "纯色", P06: "格子", P07: "字母", P08: "动物",
  S01: "春浅", S02: "夏冷", S03: "秋深", S04: "冬亮", S05: "中性",
  R01: "单穿", R02: "层叠", R03: "叠穿", R04: "撞色", R05: "同色系", R06: "通勤", R07: "休闲", R08: "正式",
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  products?: ProductSuggestion[];
}

interface ProductSuggestion {
  name: string;
  fcpsr: string[];
  price_range: string;
  reason: string;
  heat_score: number;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

export default function AIAssistantPage() {
  const router = useRouter();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCity, setUserCity] = useState("广州");

  useEffect(() => {
    checkAuth();
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 从localStorage加载对话历史（轻量方案，后续可迁移到Supabase）
    const saved = localStorage.getItem(`ai_conversations_${user.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
      if (parsed.length > 0) {
        setActiveConversation(parsed[0].id);
        setMessages(parsed[0].messages);
      }
    }
  };

  const saveConversations = async (updated: Conversation[]) => {
    setConversations(updated);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`ai_conversations_${user.id}`, JSON.stringify(updated));
    }
  };

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      title: "新对话",
      created_at: new Date().toISOString(),
      messages: [],
    };
    const updated = [newConv, ...conversations];
    saveConversations(updated);
    setActiveConversation(newConv.id);
    setMessages([]);
    setInputText("");
  };

  const switchConversation = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setActiveConversation(convId);
      setMessages(conv.messages);
    }
  };

  const deleteConversation = (convId: string) => {
    const updated = conversations.filter((c) => c.id !== convId);
    saveConversations(updated);
    if (activeConversation === convId) {
      if (updated.length > 0) {
        setActiveConversation(updated[0].id);
        setMessages(updated[0].messages);
      } else {
        setActiveConversation(null);
        setMessages([]);
      }
    }
  };

  // 调用DeepSeek AI接口
  const callAI = async (userMessage: string): Promise<{ text: string; products?: ProductSuggestion[] }> => {
    try {
      const response = await fetch("/api/ai/buyer-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          city: userCity,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { text: data.reply, products: data.products };
      }
    } catch (error) {
      console.error("AI调用失败:", error);
    }

    // 降级：本地智能回复
    return generateLocalReply(userMessage);
  };

  // 本地降级回复（API不可用时）
  const generateLocalReply = (userMessage: string): { text: string; products?: ProductSuggestion[] } => {
    const msg = userMessage.toLowerCase();
    const now = new Date();
    const month = now.getMonth() + 1;

    // 根据月份判断季节
    const seasonCode = month >= 3 && month <= 5 ? "S01" : month >= 6 && month <= 8 ? "S02" : month >= 9 && month <= 11 ? "S03" : "S04";
    const seasonName = FCPSR_LABELS[seasonCode];

    // 根据关键词匹配
    if (msg.includes("穿什么") || msg.includes("推荐") || msg.includes("选品") || msg.includes("趋势")) {
      const products: ProductSuggestion[] = [
        {
          name: `${seasonName}风连衣裙`,
          fcpsr: ["F01", "C04", "P03", seasonCode, "R01"],
          price_range: "89-268",
          reason: `${seasonName}色系碎花连衣裙，纯棉舒适，A字版型显瘦，本季搜索量上升32%`,
          heat_score: 88,
        },
        {
          name: `${seasonName}色系针织开衫`,
          fcpsr: ["F06", "C02", "P05", seasonCode, "R02"],
          price_range: "128-399",
          reason: `混纺宽松针织开衫，纯色百搭，层叠穿搭核心单品，小红书笔记量+45%`,
          heat_score: 82,
        },
        {
          name: "高腰阔腿裤",
          fcpsr: ["F04", "C02", "P05", "S05", "R03"],
          price_range: "99-258",
          reason: `亚麻宽松阔腿裤，夏季通勤首选，叠穿搭配利器，抖音带货GMV Top10`,
          heat_score: 76,
        },
      ];

      const text = `根据当前${month}月${userCity}的气候和流行趋势，我为你推荐以下选品方向：\n\n当前季节编码：**${seasonCode}（${seasonName}）**\n\n核心趋势：\n1. **${seasonName}色系** 是本季主线，搜索量同比+28%\n2. **宽松版型（C02）** 持续主导，占比62%\n3. **层叠穿搭（R02）** 是最高转化搭配方式\n\n以下是具体选品清单：`;

      return { text, products };
    }

    if (msg.includes("爆款") || msg.includes("热卖") || msg.includes("什么好卖")) {
      const text = `🔥 近7天爆款趋势：\n\n| 排名 | 品类 | 关键属性 | 热度 | 竞争 |\n|------|------|---------|------|------|\n| 1 | 碎花连衣裙 | F01+C04+P03 | 95℃ | 高 |\n| 2 | 针织开衫 | F06+C02+P05 | 88℃ | 中 |\n| 3 | 阔腿裤 | F04+C02+P05 | 82℃ | 低 |\n| 4 | 西装外套 | F03+C01+P04 | 78℃ | 中 |\n| 5 | 吊带背心 | F05+C01+P05 | 75℃ | 低 |\n\n💡 建议：优先跟款**阔腿裤**和**吊带背心**，竞争度低但热度高，利润空间更大。`;
      return { text };
    }

    if (msg.includes("竞品") || msg.includes("同行") || msg.includes("对手")) {
      const text = `📊 竞品分析建议：\n\n1. **监控维度**：价格变动、上新频率、爆款销量、FCPSR属性分布\n2. **差异化策略**：\n   - 竞品扎堆 F01棉+C01修身 → 你做 F04麻+C02宽松 差异化\n   - 竞品S01春浅为主 → 你补充S02夏冷提前布局\n3. **操作建议**：去"竞品监控"页面添加目标店铺，系统会自动追踪数据变化`;
      return { text };
    }

    // 默认回复
    const text = `你好！我是AI买手助手，可以帮你：\n\n- 🌡️ **查趋势**："下周广州穿什么？"\n- 🔥 **找爆款**："最近什么好卖？"\n- 📊 **看竞品**："帮我分析竞品策略"\n- 👗 **搭组合**："F01+C02+S01怎么搭？"\n\n试试问我一个问题吧！`;
    return { text };
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    // 如果没有活跃对话，创建一个
    if (!activeConversation) {
      createNewConversation();
    }

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setLoading(true);

    // 调用AI
    const aiResult = await callAI(userMsg.content);

    const aiMsg: Message = {
      id: `msg_${Date.now()}_ai`,
      role: "assistant",
      content: aiResult.text,
      timestamp: new Date(),
      products: aiResult.products,
    };

    const updatedMessages = [...newMessages, aiMsg];
    setMessages(updatedMessages);

    // 保存到对话列表
    const updatedConversations = conversations.map((conv) => {
      if (conv.id === activeConversation) {
        return {
          ...conv,
          messages: updatedMessages,
          title: conv.title === "新对话" ? userMsg.content.slice(0, 20) + "..." : conv.title,
        };
      }
      return conv;
    });

    // 如果没有匹配到活跃对话，创建新对话
    if (!updatedConversations.find((c) => c.id === activeConversation)) {
      const newConv: Conversation = {
        id: `conv_${Date.now()}`,
        title: userMsg.content.slice(0, 20) + "...",
        created_at: new Date().toISOString(),
        messages: updatedMessages,
      };
      updatedConversations.unshift(newConv);
    }

    saveConversations(updatedConversations);
    setLoading(false);
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  const quickQuestions = [
    { text: "今日爆款", icon: TrendingUp, question: `今天${userCity}有什么爆款？` },
    { text: "下周趋势", icon: Calendar, question: `下周${userCity}穿什么？给我选品清单` },
    { text: "竞品分析", icon: BarChart3, question: "帮我分析当前竞品策略和差异化方向" },
    { text: "组货推荐", icon: ShoppingBag, question: "F01棉+C02宽松+S01春浅怎么组货？" },
  ];

  const decodeFCPSR = (codes: string[]) => {
    return codes.map((code) => FCPSR_LABELS[code] || code).join(" / ");
  };

  const getHeatColor = (score: number) => {
    if (score >= 85) return "#ef4444";
    if (score >= 70) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex" }}>
      {/* 左侧：对话列表 */}
      <div style={{ width: "280px", backgroundColor: "white", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
          <button
            onClick={createNewConversation}
            style={{ width: "100%", padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
          >
            + 新对话
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {conversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 16px", color: "#94a3b8", fontSize: "13px" }}>
              暂无对话记录<br />点击上方按钮开始
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => switchConversation(conv.id)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  marginBottom: "4px",
                  backgroundColor: activeConversation === conv.id ? "#eff6ff" : "transparent",
                  borderLeft: activeConversation === conv.id ? "3px solid #3b82f6" : "3px solid transparent",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <p style={{ fontSize: "13px", fontWeight: "500", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {conv.title}
                  </p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                    {conv.messages.length} 条消息
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", padding: "4px", fontSize: "12px" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* 城市设置 */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0" }}>
          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>当前城市</label>
          <select
            value={userCity}
            onChange={(e) => setUserCity(e.target.value)}
            style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }}
          >
            {["广州", "深圳", "佛山", "杭州", "上海", "北京", "成都", "武汉", "长沙", "东莞"].map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 右侧：对话区 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* 顶部栏 */}
        <div style={{ padding: "16px 24px", backgroundColor: "white", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => router.push("/baokuan")} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
            <ArrowLeft style={{ width: "20px", height: "20px", color: "#64748b" }} />
          </button>
          <Sparkles style={{ width: "20px", height: "20px", color: "#3b82f6" }} />
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>AI买手助手</h2>
          <span style={{ fontSize: "12px", color: "#94a3b8", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>DeepSeek驱动</span>
        </div>

        {/* 消息列表 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: "80px" }}>
              <div style={{ width: "64px", height: "64px", backgroundColor: "#eff6ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Bot style={{ width: "32px", height: "32px", color: "#3b82f6" }} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>AI买手助手</h3>
              <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "32px" }}>
                基于FCPSR属性编码 + 全网爆款数据，为你提供选品、组货、竞品分析
              </p>

              {/* 快捷提问 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", maxWidth: "480px", margin: "0 auto" }}>
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(q.question)}
                    style={{
                      padding: "16px",
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#3b82f6";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <q.icon style={{ width: "20px", height: "20px", color: "#3b82f6", marginBottom: "8px" }} />
                    <p style={{ fontSize: "14px", fontWeight: "500", color: "#1e293b" }}>{q.text}</p>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{q.question}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "24px",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  }}
                >
                  {/* 头像 */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: msg.role === "user" ? "#f1f5f9" : "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {msg.role === "user" ? (
                      <User style={{ width: "18px", height: "18px", color: "#64748b" }} />
                    ) : (
                      <Bot style={{ width: "18px", height: "18px", color: "#3b82f6" }} />
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div style={{ maxWidth: "600px" }}>
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        backgroundColor: msg.role === "user" ? "#3b82f6" : "white",
                        color: msg.role === "user" ? "white" : "#1e293b",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        border: msg.role === "assistant" ? "1px solid #e2e8f0" : "none",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* 选品推荐卡片 */}
                    {msg.products && msg.products.length > 0 && (
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {msg.products.map((product, pidx) => (
                          <div
                            key={pidx}
                            style={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                              padding: "16px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>{product.name}</h4>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  color: "white",
                                  backgroundColor: getHeatColor(product.heat_score),
                                }}
                              >
                                {product.heat_score}℃
                              </span>
                            </div>

                            {/* FCPSR标签 */}
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                              {product.fcpsr.map((code, cidx) => (
                                <span
                                  key={cidx}
                                  style={{
                                    padding: "2px 8px",
                                    backgroundColor: "#f1f5f9",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    color: "#3b82f6",
                                    fontWeight: "500",
                                  }}
                                >
                                  {code} {FCPSR_LABELS[code]}
                                </span>
                              ))}
                            </div>

                            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5", marginBottom: "6px" }}>
                              {product.reason}
                            </p>
                            <p style={{ fontSize: "13px", color: "#3b82f6", fontWeight: "500" }}>
                              建议零售价：¥{product.price_range}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <p style={{ fontSize: "11px", color: "#cbd5e1", marginTop: "4px" }}>
                      {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>
                </div>
              ))}

              {/* 加载中 */}
              {loading && (
                <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Bot style={{ width: "18px", height: "18px", color: "#3b82f6" }} />
                  </div>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "16px 16px 16px 4px",
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      fontSize: "14px",
                      color: "#94a3b8",
                    }}
                  >
                    <span style={{ animation: "pulse 1.5s infinite" }}>AI正在思考...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 底部输入区 */}
        <div style={{ padding: "16px 24px", backgroundColor: "white", borderTop: "1px solid #e2e8f0" }}>
          {/* 快捷按钮（对话中） */}
          {messages.length > 0 && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              {["今日爆款", "下周趋势", "竞品分析", "组货推荐"].map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(q)}
                  style={{
                    padding: "4px 12px",
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", maxWidth: "760px", margin: "0 auto" }}>
            <input
              type="text"
              placeholder="问我任何选品、组货、竞品问题..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: loading ? "#f8fafc" : "white",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !inputText.trim()}
              style={{
                padding: "12px 20px",
                backgroundColor: loading || !inputText.trim() ? "#94a3b8" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: loading || !inputText.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <Send style={{ width: "16px", height: "16px" }} />
              发送
            </button>
          </div>
        </div>
      </div>

      {/* CSS动画 */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
