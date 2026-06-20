import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// 获取单个充值订单详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('charge_orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('获取充值订单详情失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('获取充值订单详情异常:', error);
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 更新充值订单（管理员确认充值）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { status, payment_proof, admin_remark } = body;

    // 获取当前订单信息
    const { data: currentOrder } = await supabase
      .from('charge_orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!currentOrder) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    // 构建更新数据
    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
      
      // 如果状态改为已支付，记录支付时间
      if (status === 'paid' && currentOrder.status === 'pending') {
        updateData.paid_at = new Date().toISOString();
      }
      
      // 如果状态改为已确认，记录确认时间和确认人
      if (status === 'confirmed' && currentOrder.status !== 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
        updateData.confirmed_by = user.id;
      }
    }

    if (payment_proof !== undefined) {
      updateData.payment_proof = payment_proof;
    }

    if (admin_remark !== undefined) {
      updateData.admin_remark = admin_remark;
    }

    const { data, error } = await supabase
      .from('charge_orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('更新充值订单失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '充值订单更新成功'
    });

  } catch (error: any) {
    console.error('更新充值订单异常:', error);
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 删除充值订单（仅管理员可删除未确认的订单）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 检查订单状态，只能删除未确认的订单
    const { data: currentOrder } = await supabase
      .from('charge_orders')
      .select('status')
      .eq('id', params.id)
      .single();

    if (!currentOrder) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    if (currentOrder.status === 'confirmed') {
      return NextResponse.json(
        { error: '已确认的订单不能删除' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('charge_orders')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('删除充值订单失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '充值订单删除成功'
    });

  } catch (error: any) {
    console.error('删除充值订单异常:', error);
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}
