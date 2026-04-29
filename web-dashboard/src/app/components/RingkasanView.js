"use client";

import React from 'react';
import {
  Leaf, Trash2, Orbit, Cpu, ArrowUpRight,
  Focus, Activity, ShieldCheck, Award
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RPieChart,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  dataVolumePerJam, dataKlasifikasiHarian, dataDistribusiSampah,
  dampakLingkungan, defaultLogs, dataPemrosesanPerJam
} from '../dashboardData';

export default function RingkasanView({ summary, binLevel, vision, logs }) {
  const graphData = dataVolumePerJam.map((d, i) =>
    i === dataVolumePerJam.length - 1 ? { ...d, volume: binLevel || d.volume } : d
  );

  const displayLogs = logs.length ? logs : defaultLogs;

  return (
    <>
      <div className="kpi-grid">
        <div className="card">
          <div className="card-title">
            <Leaf size={16} color="var(--brand-organic)" /> Total Diproses Hari Ini
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>
              {summary.total_processed}
            </span>
            <span style={{ color: 'var(--brand-organic)', fontSize: 13, display: 'flex', alignItems: 'center' }}>
              <ArrowUpRight size={14} /> 12%
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>item terklasifikasi</div>
        </div>

        <div className="card">
          <div className="card-title">
            <Trash2 size={16} color="#22d3ee" /> Level Tempat Sampah
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{binLevel}</span>
            <span style={{ color: binLevel > 80 ? '#ef4444' : '#22d3ee', fontSize: 13 }}>%</span>
          </div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div
              className="progress-fill"
              style={{
                width: `${binLevel}%`,
                background: binLevel > 80 ? '#ef4444' : binLevel > 60 ? '#f59e0b' : 'var(--brand-organic)'
              }}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-title"><Orbit size={16} /> CO2 Dikurangi</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{summary.co2}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>kg</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>estimasi bulan ini</div>
        </div>

        <div className="card">
          <div className="card-title"><Cpu size={16} /> Latensi Edge</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{summary.latency}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>ms</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>waktu respons model</div>
        </div>

        <div className="card">
          <div className="card-title"><Award size={16} color="#f59e0b" /> Akurasi Model AI</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>97.8</span>
            <span style={{ color: '#f59e0b', fontSize: 13 }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>rata-rata 7 hari</div>
        </div>

        <div className="card">
          <div className="card-title"><ShieldCheck size={16} color="var(--brand-organic)" /> Uptime Sistem</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>99.94</span>
            <span style={{ color: 'var(--brand-organic)', fontSize: 13 }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>30 hari terakhir</div>
        </div>
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ margin: 0 }}><Focus size={16} /> Mesin Visi AI</div>
            <div style={{ width: 8, height: 8, background: vision.state === 'locked' ? 'var(--brand-organic)' : 'var(--text-muted)', borderRadius: '50%' }} />
          </div>
          <div className="scanner-container" style={{ height: 320 }}>
            {vision.state === 'scanning' && <div className="scan-laser" />}
            <div
              className="bounding-box"
              style={{
                opacity: vision.state === 'locked' ? 1 : 0,
                borderColor: 'var(--brand-organic)',
                top: `${vision.box.top}%`,
                left: `${vision.box.left}%`,
                width: `${vision.box.w}%`,
                height: `${vision.box.h}%`
              }}
            >
              <div className="mono" style={{ position: 'absolute', top: -25, left: -1, background: 'var(--brand-organic)', color: '#000', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                {(vision.label || 'TERDETEKSI').toUpperCase()} {(vision.prob).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title"><Activity size={16} /> Reservoir Tempat Sampah</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
            <svg width="200" height="220" viewBox="0 0 100 120">
              <path d="M10,20 L90,20 L80,110 L20,110 Z" fill="none" stroke="var(--border-hover)" strokeWidth="2" strokeLinejoin="round" />
              <path d="M0,20 L100,20" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              <path d="M50,20 L50,110" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="4,4" />
              <rect
                x="28" width="44" rx="2" fill="var(--brand-organic)" opacity="0.9"
                height={(binLevel / 100) * 85}
                y={110 - ((binLevel / 100) * 85)}
                style={{ transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </svg>
          </div>
          <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--brand-organic)' }}>Kapasitas Bin Utama</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{binLevel}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {binLevel > 80 ? '⚠️ Segera kosongkan!' : binLevel > 60 ? '🟡 Mulai penuh' : '✅ Normal'}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card" style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">📈 Riwayat Volume Per Jam</div>
          <div style={{ flex: 1, marginTop: 16, marginLeft: -20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-organic)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--brand-organic)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="jam" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
                <Area type="monotone" dataKey="volume" stroke="var(--brand-organic)" strokeWidth={2} fill="url(#gVol)" name="Volume (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">🥧 Distribusi Jenis Sampah</div>
          <div style={{ flex: 1, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height={220}>
              <RPieChart>
                <Pie data={dataDistribusiSampah} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {dataDistribusiSampah.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {dataDistribusiSampah.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />{d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card" style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">📊 Klasifikasi Harian - 7 Hari Terakhir</div>
          <div style={{ flex: 1, marginTop: 16, marginLeft: -20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataKlasifikasiHarian} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="hari" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="organik" fill="var(--brand-organic)" radius={[4, 4, 0, 0]} name="Organik" />
                <Bar dataKey="anorganik" fill="var(--brand-inorganic)" radius={[4, 4, 0, 0]} name="Anorganik" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title"><Activity size={16} /> Log Aktivitas Terbaru</div>
          <div style={{ flex: 1, overflowY: 'auto', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayLogs.map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{log.item}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{log.time}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#22d3ee' }}>tempat-sampah</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{log.prob}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card" style={{ minHeight: 320, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">⏱️ Jumlah Item Diproses Per Jam</div>
          <div style={{ flex: 1, marginTop: 16, marginLeft: -20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataPemrosesanPerJam} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="jam" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
                <Bar dataKey="items" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Item Diproses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ minHeight: 320 }}>
          <div className="card-title">🌿 Dampak Lingkungan</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dampakLingkungan.map(d => (
              <div key={d.label} className="impact-card" style={{ textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${d.tone}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 18 }}>
                    {d.tone === '#10B981' ? '♻️' : d.tone === '#22d3ee' ? '🌍' : d.tone === '#8B5CF6' ? '🌱' : '🎯'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: d.tone }}>{d.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}