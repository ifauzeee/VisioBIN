"use client";

import React from 'react';
import { TrendingUp, Activity, Zap, Database } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  analyticsSummary, analyticsTrend, analyticsSplit,
  analyticsStations, dataTrenAkurasiHarian
} from '../dashboardData';

export default function AnalitikView() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 24, marginBottom: 24 }}>
        {analyticsSummary.map(item => (
          <div key={item.label} className="card analytics-kpi-card">
            <div className="card-title">{item.label}</div>
            <div style={{ marginTop: 8, fontSize: 34, fontWeight: 600, letterSpacing: '-1px' }}>
              {item.value}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: item.tone, fontWeight: 600 }}>
              {item.delta} vs kemarin
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card" style={{ minHeight: 360, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title"><TrendingUp size={16} /> Tren Throughput & Kepercayaan</div>
          <div style={{ flex: 1, marginTop: 16, marginLeft: -20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsTrend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-inorganic)" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="var(--brand-inorganic)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-organic)" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="var(--brand-organic)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="waktu" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[80, 100]} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area yAxisId="left" type="monotone" dataKey="throughput" stroke="var(--brand-inorganic)" strokeWidth={2} fill="url(#gTp)" name="Throughput" />
                <Area yAxisId="right" type="monotone" dataKey="kepercayaan" stroke="var(--brand-organic)" strokeWidth={2} fill="url(#gCf)" name="Kepercayaan (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ minHeight: 360, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">🔀 Campuran Sumber Input</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analyticsSplit.map(s => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                  <span className="mono" style={{ color: '#f4f4f4' }}>{s.value}%</span>
                </div>
                <div className="mix-track">
                  <div className="mix-fill" style={{ width: `${s.value}%`, background: s.tone }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="mini-stat">
              <Zap size={14} color="var(--brand-organic)" />
              <span className="mono">P95: 64ms</span>
            </div>
            <div className="mini-stat">
              <Database size={14} color="var(--brand-inorganic)" />
              <span className="mono">Drift: 0.8%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card" style={{ minHeight: 300, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">📈 Tren Akurasi Model Harian</div>
          <div style={{ flex: 1, marginTop: 16, marginLeft: -20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataTrenAkurasiHarian} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="hari" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[94, 100]} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
                <Bar dataKey="akurasi" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Akurasi (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><Activity size={16} /> Kinerja Stasiun</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="station-row station-row-header">
              <div>Stasiun</div>
              <div>Uptime</div>
              <div>Akurasi</div>
              <div>Antrian</div>
            </div>
            {analyticsStations.map(st => (
              <div key={st.id} className="station-row">
                <div style={{ fontSize: 13, fontWeight: 600 }}>{st.id}</div>
                <div className="mono">{st.uptime}</div>
                <div className="mono">{st.akurasi}</div>
                <div className="mono">{st.antrian}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}