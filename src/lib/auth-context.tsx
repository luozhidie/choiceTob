"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export type MembershipType = "none" | "view_price" | "deposit_discount";

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  company_name: string | null;
  role: "user" | "admin";
  approval_status: "pending" | "approved" | "rejected" | null;
  membership_type: MembershipType;
  membership_expires_at: string | null;
  deposit_amount: number;
  deposit_discount_rate: number;
  deposit_return_rate: number;
  view_price_package_id: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isMember: boolean;
  isViewPriceMember: boolean;
  isDepositMember: boolean;
  isHotPicksMember: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { full_name?: string; phone?: string; company_name?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 带超时的 Promise 包装
function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T | null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isViewPriceMember = !!(
    profile?.membership_type === "view_price" &&
    profile?.membership_expires_at &&
    new Date(profile.membership_expires_at) > new Date()
  );

  const isDepositMember = profile?.membership_type === "deposit_discount";
  const isMember = isViewPriceMember || isDepositMember;
  const [isHotPicksMember, setIsHotPicksMember] = useState(false);

  // 查询爆款样衣会员状态
  useEffect(() => {
    if (!user?.id) {
      setIsHotPicksMember(false);
      return;
    }
    const checkHotPicksMembership = async () => {
      const result = await withTimeout(
        supabase
          .from("hot_picks_memberships")
          .select("status, expires_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        5000
      );
      if (result && result.data && !result.error) {
        const m = result.data;
        setIsHotPicksMember(m.status === "active" && new Date(m.expires_at) > new Date());
      } else {
        setIsHotPicksMember(false);
      }
    };
    checkHotPicksMembership();
  }, [user?.id, supabase]);

  const fetchProfile = async (userId: string) => {
    try {
      const result = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single(),
        5000
      );
      if (result && result.data && !result.error) {
        setProfile(result.data as UserProfile);
      }
    } catch (err) {
      console.error("[Auth] fetchProfile error:", err);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const result = await withTimeout(supabase.auth.getUser(), 5000);
        if (result) {
          setUser(result.data.user);
          if (result.data.user) {
            await fetchProfile(result.data.user.id);
          }
        }
      } catch (err: any) {
        console.error("[Auth] init error:", err);
        setError("网络连接不稳定，请刷新页面重试");
      } finally {
        setLoading(false);
      }
    };
    init();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser.id);
          } else {
            setProfile(null);
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (err) {
      console.error("[Auth] onAuthStateChange error:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000
      );
      if (!result) {
        return { error: new Error("登录超时，请检查网络后重试") };
      }
      return { error: result.error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { full_name?: string; phone?: string; company_name?: string }
  ) => {
    try {
      const result = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { data: metadata },
        }),
        10000
      );
      if (!result) {
        return { error: new Error("注册超时，请检查网络后重试") };
      }
      return { error: result.error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await withTimeout(supabase.auth.signOut(), 5000);
    } catch (err) {
      console.error("[Auth] signOut error:", err);
    }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        isMember,
        isViewPriceMember,
        isDepositMember,
        isHotPicksMember,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
