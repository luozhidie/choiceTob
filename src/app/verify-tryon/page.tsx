'use client';

import { useState, useEffect, useRef } from 'react';

type EntState = {
  active?: boolean;
  normalLeft?: number;
  proLeft?: number;
  triesLeft?: number;
  daysLeft?: number;
  type?: string | null;
  expires?: string | null;
};

export default function VerifyTryonPage() {
  const [openid, setOpenid] = useState('');
  const [qrData, setQrData] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [status, setStatus] = useState<'idle' | 'creating' | 'ready' | 'done' | 'error'>('idle');
  const [ent, setEnt] = useState<EntState | null>(null);
  const [err, setErr] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let o = sessionStorage.getItem('verify_tryon_openid') || '';
    if (!o) {
      o = 'verify_cent_' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('verify_tryon_openid', o);
    }
    setOpenid(o);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startPay() {
    if (!openid) return;
    setErr('');
    setStatus('creating');
    try {
      const res = await fetch('/api/tryon/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: 'tryon_test_cent', platform: 'native', openid }),
      });
      const data = await res.json();
      if (!res.ok || !data.code_url) throw new Error(data.error || '下单失败');
      setOrderNo(data.order_no);
      setStatus('ready');
      const QRCode = (await import('qrcode')).default;
      const qr = await QRCode.toDataURL(data.code_url, { width: 240, margin: 1 });
      setQrData(qr);
      startPoll();
    } catch (e: any) {
      setErr(e.message || '下单失败');
      setStatus('error');
    }
  }

  function startPoll() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/tryon/entitlement?openid=' + encodeURIComponent(openid));
        const d = await res.json();
        setEnt(d);
        if (d && d.active && (d.normalLeft > 0 || d.proLeft > 0)) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStatus('done');
        }
      } catch {}
    }, 2000);
  }

  async function refresh() {
    try {
      const res = await fetch('/api/tryon/entitlement?openid=' + encodeURIComponent(openid));
      setEnt(await res.json());
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function manualCheck() {
    if (!orderNo) return;
    setErr('');
    try {
      const res = await fetch('/api/tryon/order-query?order_no=' + encodeURIComponent(orderNo));
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || '查单失败');
      setEnt(d.entitlement || null);
      if (d.entitlement && (d.entitlement.normal_left > 0 || d.entitlement.pro_left > 0)) {
        setStatus('done');
      }
    } catch (e: any) {
      setErr(e.message || '查单失败');
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg,#1c0f1e 0%,#2d1b2e 60%,#3a2330 100%)',
        color: '#f3e9df',
        fontFamily: 'system-ui,-apple-system,sans-serif',
        padding: '40px 16px 64px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#C9A24B', letterSpacing: 2 }}>CHEAT SHEET · 链路自测</span>
          <h1 style={{ fontSize: 22, margin: '6px 0 2px', fontWeight: 700 }}>一分钱验证通道</h1>
          <p style={{ fontSize: 13, color: '#b9a89c', margin: 0 }}>
            真实扫码付 ¥0.01，跑通「支付 → 发额度 → 可查」全链路
          </p>
        </div>

        <div
          style={{
            marginTop: 24,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(201,162,75,0.25)',
            borderRadius: 16,
            padding: 20,
          }}
        >
          {status === 'idle' || status === 'error' ? (
            <>
              <p style={{ fontSize: 13, color: '#cdbfb3', lineHeight: 1.7, margin: '0 0 16px' }}>
                点击下方按钮生成微信支付二维码。用微信扫码付 <b style={{ color: '#C9A24B' }}>¥0.01</b>，
                页面会自动轮询并展示到账的试衣次数。
              </p>
              <button
                onClick={startPay}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(90deg,#C9A24B,#e7c87a)',
                  color: '#2d1b2e',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                生成 ¥0.01 验证二维码
              </button>
              {err && <p style={{ color: '#ff9b9b', fontSize: 13, marginTop: 12 }}>出错：{err}</p>}
            </>
          ) : status === 'creating' ? (
            <p style={{ textAlign: 'center', color: '#cdbfb3', fontSize: 14 }}>正在生成订单…</p>
          ) : (
            <>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#cdbfb3', margin: '0 0 14px' }}>
                微信扫下方二维码，付 ¥0.01（订单号 {orderNo.slice(-8)}）
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', background: '#fff', borderRadius: 12, padding: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrData} alt="pay-qr" width={240} height={240} />
              </div>
              <button
                onClick={manualCheck}
                style={{
                  width: '100%',
                  marginTop: 14,
                  padding: '12px 0',
                  borderRadius: 10,
                  border: '1px solid rgba(201,162,75,0.5)',
                  background: 'transparent',
                  color: '#C9A24B',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                我已支付，手动查单补发
              </button>
            </>
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#cdbfb3' }}>权益到账状态</span>
            <button
              onClick={refresh}
              style={{ fontSize: 12, color: '#C9A24B', background: 'transparent', border: '1px solid rgba(201,162,75,0.4)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
            >
              手动刷新
            </button>
          </div>

          {status === 'done' ? (
            <div style={{ background: 'rgba(80,200,120,0.12)', border: '1px solid rgba(80,200,120,0.4)', borderRadius: 12, padding: 14, color: '#9be8b0' }}>
              ✅ 验证通过：普通版 +1、专业版 +1，有效期 7 天
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Stat label="普通版次数" value={ent ? ent.normalLeft ?? 0 : '—'} />
              <Stat label="专业版次数" value={ent ? ent.proLeft ?? 0 : '—'} />
              <Stat label="剩余天数" value={ent ? ent.daysLeft ?? '—' : '—'} />
            </div>
          )}
          <p style={{ fontSize: 11, color: '#8a7c72', marginTop: 12, marginBottom: 0 }}>
            测试标识：{openid}
          </p>
        </div>

        <p style={{ fontSize: 11, color: '#7a6e64', textAlign: 'center', marginTop: 20, marginBottom: 0 }}>
          本页仅用于功能验证，与正式套餐互不干扰。
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A24B' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#b9a89c', marginTop: 4 }}>{label}</div>
    </div>
  );
}
