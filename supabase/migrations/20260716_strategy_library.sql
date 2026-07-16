-- ══════════════════════════════════════════════════════════════
-- 量化地基：策略库 + 回测历史（积累策略 / 积累市场经验）
-- 设计原则：全行业覆盖、长期沉淀，学梁文锋「从 2008 起积累」的复利思路
-- ════════════════════════════════════════════════════════════════

-- 策略库（原本 readRule 读的 signal_rules 从未建表，这里正式建好）
CREATE TABLE IF NOT EXISTS signal_rules (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '默认策略',
  description TEXT NOT NULL DEFAULT '',
  ma_short INT NOT NULL DEFAULT 5,
  ma_long INT NOT NULL DEFAULT 20,
  ma_trend INT NOT NULL DEFAULT 60,
  rsi_buy_min INT NOT NULL DEFAULT 40,
  rsi_buy_max INT NOT NULL DEFAULT 70,
  rsi_sell INT NOT NULL DEFAULT 75,
  vol_ratio NUMERIC NOT NULL DEFAULT 1.2,
  stop_loss NUMERIC NOT NULL DEFAULT 0.08,
  trailing_stop NUMERIC NOT NULL DEFAULT 0.05,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 回测历史：每跑一次回测沉淀一条，随时间长成「市场经验」
CREATE TABLE IF NOT EXISTS backtest_runs (
  id BIGSERIAL PRIMARY KEY,
  strategy_id BIGINT REFERENCES signal_rules(id) ON DELETE SET NULL,
  strategy_name TEXT,
  range TEXT,
  summary JSONB,
  per_stock JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_backtest_runs_created ON backtest_runs(created_at DESC);

-- 种子：4 套跨行业、不同哲学的策略（不是只有服装）
INSERT INTO signal_rules (name, description, ma_short, ma_long, ma_trend, rsi_buy_min, rsi_buy_max, rsi_sell, vol_ratio, stop_loss, trailing_stop) VALUES
  ('趋势跟随·标准', 'MA金叉+站上趋势线+放量，经典中线趋势策略', 5, 20, 60, 40, 70, 75, 1.2, 0.08, 0.05),
  ('均线敏进', '短周期均线，信号更密、换手更高，适合捕捉中段行情', 3, 10, 30, 30, 65, 70, 1.0, 0.06, 0.04),
  ('均值回归', '超卖区反向，量比放大确认，逆人性左侧布局', 10, 60, 120, 25, 45, 55, 1.5, 0.10, 0.06),
  ('稳健长线', '长周期均线，低频高确定性，严止损宽移动止盈', 20, 60, 250, 40, 60, 80, 1.3, 0.12, 0.08)
ON CONFLICT DO NOTHING;

-- 默认监控清单改为「全行业」龙头（不再只盯服装）
DELETE FROM stock_watchlist;
INSERT INTO stock_watchlist (symbol, name, market, sector, industry) VALUES
  -- 服装/消费
  ('2020.HK', '安踏体育', 'hk', '下游品牌零售', '服装'),
  ('2331.HK', '李宁', 'hk', '下游品牌零售', '服装'),
  ('NKE', '耐克', 'us', '下游品牌零售', '服装'),
  ('LULU', '露露乐蒙', 'us', '下游品牌零售', '服装'),
  -- 科技
  ('0700.HK', '腾讯控股', 'hk', '平台', '科技'),
  ('9988.HK', '阿里巴巴', 'hk', '平台', '科技'),
  ('AAPL', '苹果', 'us', '硬件', '科技'),
  ('NVDA', '英伟达', 'us', '半导体', '科技'),
  ('TSM', '台积电', 'us', '半导体', '科技'),
  -- 金融
  ('1299.HK', '友邦保险', 'hk', '保险', '金融'),
  ('JPM', '摩根大通', 'us', '银行', '金融'),
  -- 能源
  ('0883.HK', '中国海洋石油', 'hk', '上游', '能源'),
  ('XOM', '埃克森美孚', 'us', '上游', '能源'),
  -- 医药
  ('2269.HK', '药明生物', 'hk', 'CXO', '医药'),
  ('PFE', '辉瑞', 'us', '制药', '医药'),
  -- 汽车
  ('1211.HK', '比亚迪', 'hk', '整车', '汽车'),
  ('TSLA', '特斯拉', 'us', '整车', '汽车'),
  -- 消费电子
  ('1810.HK', '小米集团', 'hk', '硬件', '消费电子'),
  ('6758.T', '索尼', 'jp', '硬件', '消费电子')
ON CONFLICT (user_id, symbol) DO NOTHING;
