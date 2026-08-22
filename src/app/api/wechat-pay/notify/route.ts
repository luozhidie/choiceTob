// app/api/wechat-pay/notify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseXml, signMd5, buildXml } from "@/lib/wechat-pay";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { settleAgentSale } from "@/lib/agent-settlement";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  }
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const xml = await request.text();
    const params = parseXml(xml);

    console.log('[微信支付回调]', params);

    // 验证签名
    const sign = params.sign;
    delete params.sign;
    const localSign = signMd5(params);

    if (localSign !== sign) {
      console.error('[微信支付回调] 签名验证失败', { localSign, sign });
      return new NextResponse(buildXml({ return_code: 'FAIL', return_msg: '签名失败' }), { headers: { 'Content-Type': 'application/xml' } });
    }
    
    const out_trade_no = params.out_trade_no;
    const transaction_id = params.transaction_id;

    // 更新订单状态 + 自动开通会员
    if (params.result_code === 'SUCCESS') {
      const supabase = await createClient();
      
      // 1. 查询 orders 订单
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('order_no', out_trade_no)
        .single();
      
      if (order) {
        // 2. 更新订单为已支付
        await supabase
          .from('orders')
          .update({ 
            status: 'paid', 
            paid_at: new Date().toISOString(),
            payment_trade_no: transaction_id,
          })
          .eq('order_no', out_trade_no);

        // 2.5 代理差价结算（仅归因订单，平台自动结算：客户实付−批发成本进代理余额）
        if (order.agent_id) {
          try {
            const svc = getServiceRoleClient();
            const r = await settleAgentSale(svc, out_trade_no);
            console.log('[代理结算]', r);
          } catch (e) {
            console.error('[代理结算失败]', e);
          }
        }

        // 3. 自动开通会员（核心逻辑）
        if (order.product_id && order.user_id) {
          await autoActivateMembership(supabase, order.user_id, order.product_id, out_trade_no);
        }
      }

      // 如果订单不存在，尝试从 membership_orders 表查找
      const { data: memberOrder } = await supabase
        .from('membership_orders')
        .select('*')
        .eq('order_no', out_trade_no)
        .single();

      if (memberOrder && memberOrder.status !== 'paid') {
        // 更新会员订单状态
        await supabase
          .from('membership_orders')
          .update({ 
            status: 'paid', 
            paid_at: new Date().toISOString(),
            transaction_id: transaction_id,
          })
          .eq('order_no', out_trade_no);

        // 自动开通会员
        await autoActivateMembership(supabase, memberOrder.user_id, memberOrder.plan_id, out_trade_no);
      }

      // 3. 词元计费订单（token_orders）：微信支付成功后激活 API Key
      const { data: tokenOrder } = await supabase
        .from('token_orders')
        .select('api_key, status')
        .eq('out_trade_no', out_trade_no)
        .single();
      if (tokenOrder && tokenOrder.status !== 'paid') {
        await supabase
          .from('token_orders')
          .update({ status: 'paid', updated_at: new Date().toISOString(), paid_at: new Date().toISOString() })
          .eq('out_trade_no', out_trade_no);
        if (tokenOrder.api_key) {
          await supabase.from('token_api_keys').update({ status: 'active' }).eq('api_key', tokenOrder.api_key);
        }
      }

      // 4. 代理/预存货款充值订单：激活 deposit_discount 身份
      await handleAgentRecharge(out_trade_no, transaction_id);
    }

    return new NextResponse(buildXml({ return_code: 'SUCCESS', return_msg: 'OK' }), { headers: { 'Content-Type': 'application/xml' } });
  } catch (err: any) {
    console.error('[微信支付回调错误]', err);
    return new NextResponse(buildXml({ return_code: 'FAIL', return_msg: err.message || 'error' }), { headers: { 'Content-Type': 'application/xml' } });
  }
}

// 自动开通会员的核心函数
async function autoActivateMembership(supabase: any, userId: string, productId: string, orderNo: string) {
  console.log('[自动开通会员]', { userId, productId, orderNo });

  // 拿货会员充值（wholesale_5w/10w/30w）：走代理店铺自动开通逻辑
  const WHOLESALE_PLANS: Record<string, { amount: number; discount: number; ret: number }> = {
    wholesale_6k: { amount: 600000, discount: 0.28, ret: 0 },
    wholesale_5w: { amount: 5000000, discount: 0.28, ret: 0.05 },
    wholesale_10w: { amount: 10000000, discount: 0.28, ret: 0.10 },
    wholesale_30w: { amount: 30000000, discount: 0.26, ret: 0.20 },
  };
  if (WHOLESALE_PLANS[productId]) {
    const plan = WHOLESALE_PLANS[productId];
    const svc = getServiceRoleClient();
    await activateStoreForDepositAgent(svc, userId, {
      deposit_amount: plan.amount,
      discount_rate: plan.discount,
      return_rate: plan.ret,
      plan_id: productId,
    });
    console.log('[自动开通会员] wholesale 代理店铺已开通', { userId, productId });
    return;
  }

  // 根据 productId/planId 判断会员类型和有效期
  let membershipType = 'none';
  let expiresAt = new Date();

  // 爆款样衣会员
  if (productId === 'hotpicks_monthly') {
    membershipType = 'hotpicks';
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天
  }
  // 查看价格会员 - 体验卡 (支持新旧 plan_id 格式)
  else if (productId === 'view_price_trial' || productId === 'price_trial') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14天
  }
  // 查看价格会员 - 1年
  else if (productId === 'view_price_year1' || productId === 'price_1y') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1年
  }
  // 查看价格会员 - 2年
  else if (productId === 'view_price_year2' || productId === 'price_2y') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000); // 2年
  }
  // 查看价格会员 - 3年
  else if (productId === 'view_price_year3' || productId === 'price_3y') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000); // 3年
  }
  // 每日穿搭查看（兼容旧 plan_id）
  else if (productId === 'daily_looks') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1年
  }
  // 每日搭配灵感 - 月度会员
  else if (productId === 'daily_looks_monthly') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天
  }
  // 每日搭配灵感 - 年度会员
  else if (productId === 'daily_looks_yearly') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1年
  }
  // 其他类型...

  // 更新 profiles 表的会员信息
  const { error } = await supabase
    .from('profiles')
    .update({
      membership_type: membershipType,
      membership_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[自动开通会员失败]', error);
  } else {
    console.log('[自动开通会员成功]', { userId, membershipType, expiresAt });
  }
}

// 代理/预存货款充值发放
async function handleAgentRecharge(out_trade_no: string, transaction_id: string) {
  try {
    const supabase = getServiceRoleClient();

    const { data: rec } = await supabase
      .from('agent_recharges')
      .select('*')
      .eq('order_no', out_trade_no)
      .single();

    if (!rec || rec.status === 'paid') return;

    // 更新订单为已支付（测试单也标记，但不发放真实权益）
    await supabase
      .from('agent_recharges')
      .update({
        status: 'paid',
        transaction_id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('order_no', out_trade_no);

    // 测试订单（agent_test_cent，1 分）仅验证链路，不发放真实权益
    if (rec.plan_id === 'agent_test_cent') {
      console.log('[代理充值] 测试订单已标记 paid，不发放权益', { order: out_trade_no });
      return;
    }

    // 根据 openid 反查用户，自动开通代理店铺
    const openid = rec.openid;
    const { data: byWechat } = await supabase
      .from('profiles')
      .select('id')
      .eq('wechat_openid', openid)
      .maybeSingle();
    const { data: byWx } = await supabase
      .from('profiles')
      .select('id')
      .eq('wx_openid', openid)
      .maybeSingle();

    const profile = byWechat || byWx;
    if (profile?.id) {
      const is6k = rec.plan_id === 'wholesale_6k';
      const alreadyGranted = rec.tryon_granted || rec.deposit_granted_flag;

      if (alreadyGranted) {
        // 幂等：已发放过（回调重放），跳过发放与激活，避免重复加货款
        console.log('[代理充值] 已发放过，跳过（幂等）', { order: out_trade_no });
        return;
      }

      // 计算实际货款与试衣费（wholesale_6k 扣 998 试衣费，其余全额进货款）
      let tryonFee = 0;
      let depositGrant = Number(rec.deposit_amount) || 0;

      if (is6k) {
        tryonFee = 99800; // ¥998 专业版试衣费（分）
        depositGrant = (Number(rec.amount) || 600000) - tryonFee; // 剩余进货款 = 500200
      }

      // 发放试衣权益（6k 套餐）
      if (is6k) {
        try {
          const { grantTryonEntitlement } = await import('@/lib/tryon-grant');
          await grantTryonEntitlement(supabase, openid, 'tryon_pro_998');
          console.log('[代理充值] 已发放 tryon_pro_998', { order: out_trade_no, openid });
        } catch (e) {
          console.error('[代理充值] 试衣权益发放失败', e);
        }
      }

      // 标记发放（幂等标志）
      await supabase
        .from('agent_recharges')
        .update({
          tryon_fee: tryonFee,
          deposit_granted: depositGrant,
          tryon_granted: is6k ? true : rec.tryon_granted,
          deposit_granted_flag: true,
        })
        .eq('order_no', out_trade_no);

      await activateStoreForDepositAgent(supabase, profile.id, {
        deposit_amount: depositGrant,
        discount_rate: Number(rec.discount_rate) || 1,
        return_rate: Number(rec.return_rate) || 0,
        plan_id: rec.plan_id,
      });
      console.log('[代理充值] 已激活并开通店铺', { order: out_trade_no, user: profile.id, depositGrant });
    } else {
      console.log('[代理充值] 已到账，但未找到关联 profile，openid=', openid);
    }
  } catch (err: any) {
    console.error('[代理充值回调错误]', err);
  }
}

// 预存货款充值后自动开通代理店铺（复用于 agent_recharges 与 membership_orders wholesale 计划）
async function activateStoreForDepositAgent(
  svc: any,
  userId: string,
  rec: { deposit_amount: number; discount_rate: number; return_rate: number; plan_id?: string }
) {
  try {
    const { data: profile } = await svc
      .from('profiles')
      .select('id, full_name, invite_code, deposit_amount, deposit_discount_rate, deposit_return_rate')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return;

    // 兜底生成推广码
    let inviteCode = profile.invite_code || null;
    if (!inviteCode) {
      inviteCode = 'LZD' + String(userId).replace(/-/g, '').slice(0, 8).toUpperCase();
    }

    const curAmount = Number(profile.deposit_amount) || 0;
    const curDisc = Number(profile.deposit_discount_rate) || 1;
    const curRet = Number(profile.deposit_return_rate) || 0;
    const addAmount = Number(rec.deposit_amount) || 0;

    await svc
      .from('profiles')
      .update({
        membership_type: 'deposit_discount',
        store_owner_certified: true,
        certified_at: new Date().toISOString(),
        deposit_amount: curAmount + addAmount,
        deposit_discount_rate: Math.min(curDisc, rec.discount_rate || 1),
        deposit_return_rate: Math.max(curRet, rec.return_rate || 0),
        invite_code: inviteCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // 自动创建店铺（如无 active 店铺）
    const { data: existingStore } = await svc
      .from('stores')
      .select('id')
      .eq('owner_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!existingStore) {
      const defaultName = profile.store_name || (profile.full_name ? profile.full_name + '的店铺' : '我的店铺');
      await svc.from('stores').insert({
        owner_id: userId,
        name: defaultName,
        contact_person: profile.full_name || null,
        phone: profile.phone || null,
        wechat: profile.wechat || null,
        city: profile.city || null,
        status: 'active',
        business_data: {
          source: 'auto_deposit',
          plan_id: rec.plan_id || null,
          auto_created_at: new Date().toISOString(),
        },
      });
    }
  } catch (err: any) {
    console.error('[activateStoreForDepositAgent]', err);
  }
}
