import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";
    const search = searchParams.get("search") || "";
    
    const supabase = await createClient();
    const offset = (page - 1) * limit;
    
    // 构建查询
    let query = supabase
      .from("visitors")
      .select("*", { count: "exact" })
      .order("last_visit_at", { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq("status", status);
    }
    
    if (source) {
      query = query.eq("source", source);
    }
    
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error("Visitors API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
