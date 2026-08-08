// app/api/admin/execute-migration/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 检查用户是否是管理员
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 检查用户角色
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }
    
    // 读取SQL文件
    const sqlFilePath = path.join(process.cwd(), 'migration-buyer-page-enhancements.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // 执行SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      // 如果exec_sql函数不存在，尝试直接执行
      console.error('RPC执行失败，尝试直接执行SQL:', error);
      
      // 分割SQL语句并逐个执行
      const sqlStatements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
      const results = [];
      
      for (const stmt of sqlStatements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
          if (stmtError) {
            results.push({ statement: stmt.substring(0, 100) + '...', error: stmtError.message });
          } else {
            results.push({ statement: stmt.substring(0, 100) + '...', success: true });
          }
        } catch (stmtError: any) {
          results.push({ statement: stmt.substring(0, 100) + '...', error: stmtError.message });
        }
      }
      
      return NextResponse.json({ 
        message: 'SQL执行完成（部分可能失败）', 
        results,
        note: '请检查数据库状态，某些语句可能执行失败'
      });
    }
    
    return NextResponse.json({ message: '数据库迁移执行成功' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    
    // 检查用户是否是管理员
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 检查用户角色
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }
    
    // 读取SQL文件内容并返回
    const sqlFilePath = path.join(process.cwd(), 'migration-buyer-page-enhancements.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    return NextResponse.json({ 
      message: '数据库迁移SQL文件内容',
      sql: sqlContent,
      note: '请复制此SQL内容，然后在Supabase仪表板的SQL编辑器中执行'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}