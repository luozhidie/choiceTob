// 下单执行层接口：策略/风控/回测只依赖此接口，不关心底层是纸面还是真实券商
// 这样接富途/老虎/IB 时，只需新增一个实现类，runStrategy 一行不用动。

export interface OrderExecutor {
  /** 记录一笔成交（买/卖），真实券商此处为「实际下单」 */
  recordTrade(trade: {
    symbol: string;
    side: "buy" | "sell";
    price: number;
    qty: number;
    source: string;
    note?: string;
  }): Promise<void>;

  /** 设置某标的持仓状态（upsert），真实券商此处为「本地镜像 + 可选回查」 */
  setPosition(pos: {
    symbol: string;
    qty: number;
    avg_cost: number | null;
    peak_price: number;
    updated_at: string;
  }): Promise<void>;
}
