import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 生成充值订单号
function generateOrderNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CZ${date}${random}`;
}

// 获取充值订单列表
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 检查用户权限
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 检查是否是管理员
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    let query = supabase
      .from('charge_orders')
      .select('*', { count: 'exact' });

    // 如果不是管理员，只能查看自己的订单
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    } else {
      // 管理员可以筛选特定用户
      if (userId) {
        query = query.eq('user_id', userId);
      }
    }

    // 状态筛选
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 分页和排序
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('获取充值订单失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    });

  } catch (error: any) {
    console.error('获取充值订单异常:', error);
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 创建充值订单
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 检查用户登录
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, discount_rate, payment_method, remark } = body;

    // 验证必填字段
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '充值金额必须大于0' }, { status: 400 });
    }

    // 计算实际到账金额
    const actualAmount = discount_rate ? amount * discount_rate : amount;

    // 获取用户信息
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('email, name')
      .eq('id', user.id)
      .single();

    // 创建充值订单
    const { data, error } = await supabase
      .from('charge_orders')
      .insert({
        order_no: generateOrderNo(),
        user_id: user.id,
        user_email: userProfile?.email || user.email,
        user_name: userProfile?.name || '',
        amount,
        discount_rate,
        actual_amount: actualAmount,
        payment_method,
        status: 'pending',
        remark
      })
      .select()
      .single();

    if (error) {
      console.error('创建充值订单失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '充值订单创建成功'
    });

  } catch (error: any) {
    console.error('创建充值订单异常:', error);
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}
