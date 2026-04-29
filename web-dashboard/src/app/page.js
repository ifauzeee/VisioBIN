"use client";

import React, { useState, useEffect } from 'react';
import {
  SquareTerminal, BarChart, Settings2, Trash2, ShieldCheck,
  Activity, Cpu, Search, Box, History, Users, LogOut,
  Video, TrendingUp, FileText, Clock
} from 'lucide-react';

import LoginScreen from './components/LoginScreen';
import RingkasanView from './components/RingkasanView';
import PemantauanView from './components/PemantauanView';
import AnalitikView from './components/AnalitikView';
import LaporanView from './components/LaporanView';
import PerangkatView from './components/PerangkatView';

export default function VisioBinDashboard() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeView, setActiveView] = useState('ringkasan');
  const [token, setToken] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '', error: '', loading: false });
  const [currentTime, setCurrentTime] = useState(new Date());

  const [summary, setSummary] = useState({ total_processed: 0, co2: 0, latency: 14 });
  const [vision, setVision] = useState({ state: 'scanning', label: 'terdeteksi', prob: 0, box: { top: 20, left: 20, w: 60, h: 60 } });
  const [logs, setLogs] = useState([]);
  const [binLevel, setBinLevel] = useState(0);

  useEffect(() => {
    setMounted(true);
    const storedAuth = window.localStorage.getItem('visiobin_auth');
    const storedToken = window.localStorage.getItem('visiobin_token');

    if (storedAuth === 'true' && storedToken) {
      setIsAuthenticated(true);
      setToken(storedToken);
    }
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const fetchData = async () => {
      try {
        const summaryRes = await fetch("http://localhost:8080/api/v1/dashboard/summary", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const summaryData = await summaryRes.json();

        if (summaryData.success) {
          const s = summaryData.data;
          const org = s.organic_count_today || 0;
          const inorg = s.inorganic_count_today || 0;

          setSummary({
            total_processed: org + inorg,
            co2: +(org * 0.05 + inorg * 0.02).toFixed(2),
            latency: 14
          });

          if (s.bin_statuses?.length > 0) {
            const b = s.bin_statuses[0];
            const lvl = b.volume_pct ?? b.volume_total_pct ?? ((b.volume_organic_pct || 0) + (b.volume_inorganic_pct || 0)) / 2;
            setBinLevel(Math.round(lvl));
          }
        }

        const logsRes = await fetch("http://localhost:8080/api/v1/classifications?limit=10", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const logsData = await logsRes.json();

        if (logsData.success) {
          const newLogs = logsData.data.map(l => ({
            id: l.id,
            time: new Date(l.classified_at).toLocaleTimeString('id-ID', { hour12: false }),
            type: 'tempat-sampah',
            item: l.predicted_class,
            prob: l.confidence * 100
          }));

          setLogs(newLogs);

          if (newLogs.length > 0) {
            const latest = newLogs[0];
            setVision({ state: 'locked', label: latest.item, prob: latest.prob, box: { top: 30, left: 30, w: 40, h: 40 } });
            setTimeout(() => setVision(v => ({ ...v, state: 'scanning' })), 2000);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token]);

  const viewMeta = {
    ringkasan: { title: 'Ringkasan Sistem', subtitle: 'Telemetri real-time dan analisis sortir AI.', badge: 'Semua Sistem Normal', color: 'var(--brand-organic)', icon: ShieldCheck },
    pemantauan: { title: 'Pemantauan Langsung', subtitle: 'Monitoring stream kamera untuk validasi UI.', badge: '8 Stream Aktif', color: '#22d3ee', icon: Video },
    analitik: { title: 'Analitik', subtitle: 'Evaluasi performa model dan throughput harian.', badge: 'Model Stabil', color: '#f59e0b', icon: TrendingUp },
    laporan: { title: 'Laporan', subtitle: 'Ringkasan harian, mingguan, dan dampak lingkungan.', badge: 'Data 7 Hari', color: '#8B5CF6', icon: FileText },
    perangkat: { title: 'Perangkat IoT', subtitle: 'Status sensor dan kesehatan perangkat.', badge: '5 Sensor Terpasang', color: '#06B6D4', icon: Cpu },
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginForm(p => ({ ...p, loading: true, error: '' }));

    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginForm.username || "admin2",
          password: loginForm.password || "admin123"
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('visiobin_auth', 'true');
        localStorage.setItem('visiobin_token', data.data.token);
        setToken(data.data.token);
        setIsAuthenticated(true);
      } else if (loginForm.username === 'admin2' && loginForm.password === 'admin123') {
        localStorage.setItem('visiobin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setLoginForm(p => ({ ...p, error: 'Kredensial tidak valid. (Gunakan: admin2 / admin123)' }));
      }
    } catch (err) {
      if (loginForm.username === 'admin' && loginForm.password === 'admin') {
        localStorage.setItem('visiobin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setLoginForm(p => ({ ...p, error: 'Server offline. Bypass lokal: admin / admin' }));
      }
    } finally {
      setLoginForm(p => ({ ...p, loading: false }));
    }
  };

  if (!mounted || isCheckingAuth) return null;
  if (!isAuthenticated) return <LoginScreen loginForm={loginForm} setLoginForm={setLoginForm} handleLogin={handleLogin} />;

  const meta = viewMeta[activeView];
  const MetaIcon = meta.icon;

  const navItems = [
    {
      section: 'Pemantauan', items: [
        { key: 'ringkasan', label: 'Ringkasan', icon: SquareTerminal },
        { key: 'pemantauan', label: 'Pemantauan Langsung', icon: Activity },
        { key: 'analitik', label: 'Analitik', icon: BarChart },
      ]
    },
    {
      section: 'Laporan', items: [
        { key: 'laporan', label: 'Laporan', icon: FileText },
        { key: 'perangkat', label: 'Perangkat IoT', icon: Cpu },
      ]
    },
    {
      section: 'Manajemen', items: [
        { key: '_bin', label: 'Stasiun Bin', icon: Box, badge: '1' },
        { key: '_maint', label: 'Log Perawatan', icon: History },
      ]
    },
    {
      section: 'Pengaturan', items: [
        { key: '_team', label: 'Anggota Tim', icon: Users },
        { key: '_config', label: 'Konfigurasi', icon: Settings2 },
      ]
    },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 30, height: 30, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(255,255,255,0.1)' }}>
            <Trash2 size={16} color="#000" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: '#fff' }}>VisioBin</span>
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={14} color="#666" style={{ position: 'absolute', left: 12, top: 9 }} />
          <input
            type="text"
            placeholder="Cari..."
            style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 6, color: '#fff', fontSize: 13, outline: 'none' }}
          />
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', marginRight: -8, paddingRight: 8 }} className="custom-scrollbar">
          {navItems.map(group => (
            <React.Fragment key={group.section}>
              <div className="sidebar-section">{group.section}</div>
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    onClick={() => !item.key.startsWith('_') && setActiveView(item.key)}
                    className={`nav-item ${activeView === item.key ? 'active' : ''}`}
                  >
                    <Icon size={16} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && <div style={{ background: 'var(--border-color)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#fff' }}>{item.badge}</div>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="nav-item" style={{ marginLeft: -12, marginRight: -12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-inorganic), var(--brand-organic))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>IF</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Ifauze</div>
              <div style={{ fontSize: 11, color: 'var(--brand-organic)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, background: 'var(--brand-organic)', borderRadius: '50%' }}></div>
                Online
              </div>
            </div>
          </div>

          <div
            onClick={() => { localStorage.removeItem('visiobin_auth'); localStorage.removeItem('visiobin_token'); setIsAuthenticated(false); }}
            className="nav-item"
            style={{ marginLeft: -12, marginRight: -12, color: '#ef4444' }}
          >
            <LogOut size={16} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Keluar Sistem</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1px', marginBottom: 8 }}>{meta.title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{meta.subtitle}</p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="time-badge">
              <Clock size={12} style={{ marginRight: 6, verticalAlign: -1 }} />
              {currentTime.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </div>
            <div className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MetaIcon size={16} color={meta.color} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{meta.badge}</span>
            </div>
          </div>
        </header>

        {activeView === 'ringkasan' && <RingkasanView summary={summary} binLevel={binLevel} vision={vision} logs={logs} />}
        {activeView === 'pemantauan' && <PemantauanView />}
        {activeView === 'analitik' && <AnalitikView />}
        {activeView === 'laporan' && <LaporanView />}
        {activeView === 'perangkat' && <PerangkatView />}
      </main>
    </div>
  );
}