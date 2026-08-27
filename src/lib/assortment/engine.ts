import { SupabaseClient } from "@supabase/supabase-js";

// ============ 类型 ============
export interface StylePlan {
  code: string;
  name: string;
  vip_count: number;
  ratio: number;      // 占 VIP 比例 0-1
  sku: number;        // 该风格总拿货量
}

export interface CategoryPlan {
  category_code: string;
  category_name: string;
  sku: number;
}

export interface StyleOnRod {
  code: string;
  name: string;
  sku: number;            // 该风格在此杆上的 SKU（= 风格总SKU / 覆盖杆数）
  categories: CategoryPlan[];
  seasons: SeasonBucket[]; // 12 季型铺色
}

export interface MoodRodPlan {
  code: string;
  name: string;
  sku: number;            // 该风情杆总 SKU
  occasions: string[];    // 该杆服务的场合 code
  styles: StyleOnRod[];
}

export interface OccasionPlan {
  code: string;
  name: string;
  sku: number;
  moods: string[];        // 该场合下的风情 code
}

export interface SeasonBucket {
  code: string;
  name: string;
  sku: number;
}

export interface SeasonCoverage {
  style_code: string;
  style_name: string;
  total_sku: number;
  buckets: SeasonBucket[];
}

export interface AssortmentPlan {
  store_id: string;
  area: number;
  tier_label: string;
  total_sku: number;
  mood_count: number;     // 实际选用的风情数
  styles: StylePlan[];
  moods: MoodRodPlan[];
  occasions: OccasionPlan[];
  season_coverage: SeasonCoverage[];
}

export interface MixInput {
  style_code: string;
  vip_count: number;
}

// ============ 工具：整数按权重分配（最大余数法，保证总和守恒）============
function distributeInt(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || total <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const floor = raw.map(Math.floor);
  let rem = total - floor.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < rem; k++) floor[order[k % order.length].i]++;
  return floor;
}

// ============ 主引擎 ============
export async function computeAssortment(
  supabase: SupabaseClient,
  storeId: string,
  area: number,
  overrideMix?: MixInput[]
): Promise<AssortmentPlan> {
  // ---- 1. 读取参考表 ----
  const [
    stylesRes,
    seasonsRes,
    occasionsRes,
    moodsRes,
    occMoodRes,
    styleMoodRes,
    catRes,
    tiersRes,
  ] = await Promise.all([
    supabase.from("eight_styles").select("code,name,sort_order").order("sort_order"),
    supabase.from("color_seasons").select("code,name,attr_group,temperature,sort_order").order("sort_order"),
    supabase.from("occasions").select("code,name,sort_order").order("sort_order"),
    supabase.from("moods").select("code,name"),
    supabase.from("occasion_mood_map").select("occasion_code,mood_code,sort_order"),
    supabase.from("style_mood_map").select("style_code,mood_code"),
    supabase.from("style_category_sku").select("style_code,category_code,category_name,sku_ratio,sort_order"),
    supabase.from("store_area_config").select("*"),
  ]);

  const styleName: Record<string, string> = {};
  (stylesRes.data || []).forEach((r: any) => (styleName[r.code] = r.name));
  const seasonList: any[] = seasonsRes.data || [];
  const occasionList: any[] = occasionsRes.data || [];
  const moodName: Record<string, string> = {};
  (moodsRes.data || []).forEach((r: any) => (moodName[r.code] = r.name));
  const occMood: any[] = occMoodRes.data || [];
  const styleMoodRows: any[] = styleMoodRes.data || [];
  const catRows: any[] = catRes.data || [];
  const tiers: any[] = tiersRes.data || [];

  // 风格 -> 风情 映射
  const styleMoods: Record<string, string[]> = {};
  styleMoodRows.forEach((r) => {
    (styleMoods[r.style_code] ||= []).push(r.mood_code);
  });
  // 场合 -> 风情 映射
  const occasionMoods: Record<string, string[]> = {};
  const moodOccasions: Record<string, string[]> = {};
  occMood.forEach((r) => {
    (occasionMoods[r.occasion_code] ||= []).push(r.mood_code);
    (moodOccasions[r.mood_code] ||= []).push(r.occasion_code);
  });
  // 风格 -> 品类
  const styleCats: Record<string, any[]> = {};
  catRows.forEach((r) => {
    (styleCats[r.style_code] ||= []).push(r);
  });
  styleCats &&
    Object.values(styleCats).forEach((arr) => arr.sort((a, b) => a.sort_order - b.sort_order));

  // ---- 2. 店铺 VIP 风格占比（根输入）----
  let mix: MixInput[];
  if (overrideMix && overrideMix.length) {
    mix = overrideMix;
  } else {
    const { data } = await supabase
      .from("store_style_mix")
      .select("style_code,vip_count")
      .eq("store_id", storeId);
    mix = (data || []).map((r: any) => ({ style_code: r.style_code, vip_count: r.vip_count }));
  }
  const totalVip = mix.reduce((a, b) => a + b.vip_count, 0);
  if (totalVip <= 0) {
    throw new Error("该店铺没有 VIP 风格数据（store_style_mix 为空或总和为0）");
  }

  const styleRatio: Record<string, number> = {};
  const mixStyles = new Set<string>();
  mix.forEach((m) => {
    styleRatio[m.style_code] = (m.vip_count || 0) / totalVip;
    mixStyles.add(m.style_code);
  });

  // ---- 3. 面积档位 ----
  const tier =
    (tiers || []).find((t) => area >= t.area_min && (t.area_max == null || area <= t.area_max)) ||
    (tiers || []).slice(-1)[0];
  if (!tier) throw new Error("store_area_config 未配置面积档位");
  const T = tier.total_sku as number;
  const moodMin = tier.mood_count_min as number;
  const moodMax = tier.mood_count_max as number;

  // ---- 4. 每风格总 SKU = 占比 × 总SKU ----
  const styleSku: Record<string, number> = {};
  const stylePlanList: StylePlan[] = [];
  mix.forEach((m) => {
    const sku = Math.round((styleRatio[m.style_code] || 0) * T);
    styleSku[m.style_code] = sku;
    stylePlanList.push({
      code: m.style_code,
      name: styleName[m.style_code] || m.style_code,
      vip_count: m.vip_count,
      ratio: styleRatio[m.style_code] || 0,
      sku,
    });
  });
  stylePlanList.sort((a, b) => b.sku - a.sku);

  // ---- 5. 选风情杆：以【店铺实际 VIP 风格构成】为主驱动，面积档位仅作软参考 ----
  const moodScore: Record<string, number> = {};
  mix.forEach((m) => {
    (styleMoods[m.style_code] || []).forEach((md) => {
      moodScore[md] = (moodScore[md] || 0) + (styleRatio[m.style_code] || 0);
    });
  });
  // 候选风情 = 店铺实际风格所映射到的全部风情，按 VIP 占比从高到低
  const availableMoods = Object.keys(moodScore).sort((a, b) => moodScore[b] - moodScore[a]);
  const storeStyleCount = mixStyles.size; // 店铺实际有 VIP 的风格数（主驱动）

  // 面积档位的 mood_count_min/max 不是硬门槛，只是软参考：
  //  - 优先按店铺真实 VIP 构成选杆（覆盖到的风情数）
  //  - 仅当店铺跨的风格数超过档位软上限时，才以实际构成为准、允许突破上限
  //  - 下限只在“自然需要 ≥ 下限”时生效，绝不为了凑数硬塞
  const softMax = moodMax;
  const naturalCount = availableMoods.length;
  let K = Math.min(naturalCount, Math.max(moodMin, softMax));
  if (storeStyleCount > softMax) {
    K = Math.min(naturalCount, storeStyleCount); // 实际构成优先，突破软上限
  }
  K = Math.max(1, K);
  const selected = new Set<string>(availableMoods.slice(0, K));

  // 兜底：未被任何选中杆覆盖的风格，把它的最高分风情补进来（最多补到全部候选，保证每个风格至少 1 杆）
  const coverCount: Record<string, number> = {};
  mix.forEach((m) => {
    coverCount[m.style_code] = (styleMoods[m.style_code] || []).filter((md) => selected.has(md)).length;
  });
  let guard = 0;
  mix.forEach((m) => {
    while (coverCount[m.style_code] === 0 && selected.size < availableMoods.length && guard < 100) {
      const candidates = (styleMoods[m.style_code] || []).sort(
        (a, b) => (moodScore[b] || 0) - (moodScore[a] || 0)
      );
      const pick = candidates.find((md) => !selected.has(md));
      if (!pick) break;
      selected.add(pick);
      // 重算所有风格的 coverCount
      mix.forEach((mm) => {
        coverCount[mm.style_code] = (styleMoods[mm.style_code] || []).filter((md) => selected.has(md)).length;
      });
      guard++;
    }
  });

  const selectedMoods = Array.from(selected);

  // ---- 6. 每风情杆 SKU = Σ(风格SKU / 该风格覆盖杆数) ----
  const moodRodSku: Record<string, number> = {};
  selectedMoods.forEach((md) => {
    let s = 0;
    mix.forEach((m) => {
      if ((styleMoods[m.style_code] || []).includes(md)) {
        s += (styleSku[m.style_code] || 0) / Math.max(1, coverCount[m.style_code]);
      }
    });
    moodRodSku[md] = Math.round(s);
  });

  // ---- 7. 场合分配：每杆按所服务的场合数平摊 ----
  const occasionSku: Record<string, number> = {};
  occasionList.forEach((o) => (occasionSku[o.code] = 0));
  selectedMoods.forEach((md) => {
    const occs = (moodOccasions[md] || []).filter((o) => occasionMoods[o]);
    const n = occs.length || 1;
    occs.forEach((o) => {
      occasionSku[o] += Math.round((moodRodSku[md] || 0) / n);
    });
    // 若杆未挂任何场合，归入全部场合平摊，避免丢失
    if (occs.length === 0) {
      occasionList.forEach((o) => {
        occasionSku[o.code] += Math.round((moodRodSku[md] || 0) / occasionList.length);
      });
    }
  });

  // ---- 8. 组装风情杆：风格 -> 品类 + 12季型 ----
  const moodsOut: MoodRodPlan[] = selectedMoods.map((md) => {
    const served = mix.filter((m) => (styleMoods[m.style_code] || []).includes(md));
    const stylesOnRod: StyleOnRod[] = served.map((m) => {
      const portion = Math.round((styleSku[m.style_code] || 0) / Math.max(1, coverCount[m.style_code]));
      // 品类拆分
      const cats = styleCats[m.style_code] || [];
      const catWeights = cats.map((c) => Number(c.sku_ratio) || 0);
      const catSkus = distributeInt(portion, catWeights);
      const categories: CategoryPlan[] = cats.map((c, i) => ({
        category_code: c.category_code,
        category_name: c.category_name,
        sku: catSkus[i],
      }));
      // 12 季型铺色（等权，保证陈列量）
      const seasonWeights = seasonList.map(() => 1);
      const seasonSkus = distributeInt(portion, seasonWeights);
      const seasons: SeasonBucket[] = seasonList.map((s, i) => ({
        code: s.code,
        name: s.name,
        sku: seasonSkus[i],
      }));
      return {
        code: m.style_code,
        name: styleName[m.style_code] || m.style_code,
        sku: portion,
        categories,
        seasons,
      };
    });
    const occs = (moodOccasions[md] || []).filter((o) => occasionMoods[o]);
    return {
      code: md,
      name: moodName[md] || md,
      sku: moodRodSku[md] || 0,
      occasions: occs.length ? occs : occasionList.map((o) => o.code),
      styles: stylesOnRod,
    };
  });
  moodsOut.sort((a, b) => b.sku - a.sku);

  // ---- 9. 场合汇总 ----
  const occasionsOut: OccasionPlan[] = occasionList.map((o) => {
    const ms = (occasionMoods[o.code] || []).filter((md) => selected.has(md));
    return {
      code: o.code,
      name: o.name,
      sku: occasionSku[o.code] || 0,
      moods: ms,
    };
  });

  // ---- 10. 12 季型铺色总览（每风格）----
  const seasonCoverage: SeasonCoverage[] = mix.map((m) => {
    const total = styleSku[m.style_code] || 0;
    const seasonWeights = seasonList.map(() => 1);
    const seasonSkus = distributeInt(total, seasonWeights);
    return {
      style_code: m.style_code,
      style_name: styleName[m.style_code] || m.style_code,
      total_sku: total,
      buckets: seasonList.map((s, i) => ({ code: s.code, name: s.name, sku: seasonSkus[i] })),
    };
  });

  // 总 SKU 取各杆之和（取整后可能略偏，以档位 T 为标注）
  return {
    store_id: storeId,
    area,
    tier_label: tier.size_label,
    total_sku: T,
    mood_count: selectedMoods.length,
    styles: stylePlanList,
    moods: moodsOut,
    occasions: occasionsOut,
    season_coverage: seasonCoverage,
  };
}
