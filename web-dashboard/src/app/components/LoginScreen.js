"use client";

import React from 'react';
import { Trash2, ShieldCheck } from 'lucide-react';

export default function LoginScreen({ loginForm, setLoginForm, handleLogin, handleGuestLogin }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <div style={{
        flex: 1,
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: 60,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(16,185,129,0.05) 0%, transparent 60%)'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            background: 'var(--text-main)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-card)'
          }}>
            <Trash2 size={24} color="var(--bg-card)" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            VisioBin Core
          </span>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          marginTop: 40
        }}>
          <svg width="180" height="240" viewBox="0 0 100 120" style={{ margin: '0 0 40px 0', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}>
            <defs>
              <linearGradient id="loginGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.1)' }} />
                <stop offset="100%" style={{ stopColor: 'rgba(255,255,255,0.02)' }} />
              </linearGradient>
            </defs>
            <path d="M15,20 L85,20 L75,115 L25,115 Z" fill="url(#loginGlass)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M5,20 L95,20" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" />
            <path d="M50,20 L50,115" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4,4" />
            <rect
              x="34" width="32" rx="2" fill="var(--brand-organic)" opacity="0.9"
              height="72" y="38"
              style={{ filter: 'drop-shadow(0 0 15px rgba(16,185,129,0.4))' }}
            />
          </svg>
          <h2 style={{ fontSize: 40, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-1.5px', marginBottom: 16, lineHeight: 1.1 }}>
            Terminal Sortir AI<br />Pintar & Otomatis.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.6, maxWidth: 440 }}>
            Sistem klasifikasi sampah otomatis generasi berikutnya berbasis model neural vision.
            Dibangun untuk presisi absolut.
          </p>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'var(--bg-page)' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.5px', marginBottom: 8 }}>
            Masuk dengan aman
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 40 }}>
            Masukkan kredensial Anda untuk mengakses konsol
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
                Nama Pengguna
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-main)', fontSize: 14, outline: 'none' }}
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
                Kata Sandi
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-main)', fontSize: 14, outline: 'none' }}
                placeholder="••••••••"
                required
              />
            </div>

            {loginForm.error && (
              <div style={{
                color: '#ef4444',
                fontSize: 13,
                textAlign: 'center',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: 10,
                borderRadius: 6
              }}>
                {loginForm.error}
              </div>
            )}

            <button
              type="submit"
              disabled={loginForm.loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--text-main)',
                color: 'var(--bg-page)',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                marginTop: 12,
                cursor: 'pointer',
                opacity: loginForm.loading ? 0.7 : 1
              }}
            >
              {loginForm.loading ? 'Mengautentikasi...' : 'Masuk ke Sistem'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>atau</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loginForm.loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loginForm.loading ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              Masuk sebagai Tamu
            </button>
          </form>

          <div style={{
            marginTop: 40,
            borderTop: '1px solid var(--border-color)',
            paddingTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            color: 'var(--text-muted)',
            fontSize: 12
          }}>
            <ShieldCheck size={14} color="var(--brand-organic)" />
            Diamankan oleh Protokol Zero-Trust VisioBin
          </div>
        </div>
      </div>
    </div>
  );
}