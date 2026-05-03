"use client";

import React from 'react';
import {
  Leaf, Trash2, Orbit, Cpu, ArrowUpRight,
  Focus, Activity, ShieldCheck, Award
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RPieChart,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Brush
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Info, Leaf as LeafIcon } from 'lucide-react';
import {
  dataVolumePerJam, dataKlasifikasiHarian, dataDistribusiSampah,
  dampakLingkungan, defaultLogs, dataPemrosesanPerJam
} from '../dashboardData';

export default function RingkasanView({ summary, binLevel, vision, logs }) {
  // Use real data from summary if available, fallback to sample data for visual consistency if empty
  const graphData = summary.volume_history?.length > 0 
    ? summary.volume_history.map(d => ({ jam: d.hour, volume: d.volume }))
    : dataVolumePerJam;

  const dailyStats = summary.daily_stats?.length > 0
    ? summary.daily_stats.map(d => ({ hari: d.day, organik: d.organic, anorganik: d.inorganic }))
    : dataKlasifikasiHarian;

  const distributionData = summary.distribution?.length > 0
    ? summary.distribution
    : dataDistribusiSampah;

  const processingData = summary.processing_history?.length > 0
    ? summary.processing_history.map(d => ({ jam: d.hour, items: d.items }))
    : dataPemrosesanPerJam;

  const displayLogs = logs.length ? logs : defaultLogs;

  const computedAccuracy = logs.length > 0
    ? (logs.reduce((acc, l) => acc + (l.prob || 0), 0) / logs.length).toFixed(1)
    : '97.8';

  const computedLatency = logs.length > 0
    ? Math.round(logs.reduce((acc, l) => acc + (l.inference_ms || 0), 0) / logs.length)
    : summary.latency || 14;

  const generateInsight = () => {
    const total = summary.total_processed || 0;
    const co2 = summary.co2 || 0;
    const trend = 12;
    
    if (total > 500) {
      return {
        text: `Minggu ini, volume pemrosesan di sektor utama meningkat ${trend}%. Stasiun Bin 04 menunjukkan aktivitas tertinggi. Disarankan untuk menambah jadwal pengangkutan di hari Jumat malam.`,
        type: 'warning',
        icon: <TrendingUp size={16} />
      };
    }
    return {
      text: `Sistem beroperasi optimal. Efisiensi pemilahan mencapai 97.8% hari ini. Emisi CO2 berhasil dikurangi sebanyak ${co2}kg secara kumulatif.`,
      type: 'success',
      icon: <Sparkles size={16} />
    };
  };
  const insight = generateInsight();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* AI Insight Narrative */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
        style={{ 
          marginBottom: 24, 
          background: "linear-gradient(90deg, var(--bg-card) 0%, var(--bg-hover) 100%)",
          border: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 24px"
        }}
      >
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 12, 
          background: insight.type === 'success' ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: insight.type === 'success' ? "var(--brand-organic)" : "#f59e0b"
        }}>
          {insight.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>VisioBin AI Insight</span>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border-hover)" }} />
            <span style={{ fontSize: 11, color: "var(--brand-organic)", fontWeight: 600 }}>Baru saja</span>
          </div>
          <div style={{ fontSize: 14, color: "var(--text-main)", lineHeight: 1.5 }}>
            {insight.text}
          </div>
        </div>
        <button style={{ 
          background: "transparent", 
          border: "1px solid var(--border-color)", 
          padding: "8px 16px", 
          borderRadius: 8,
          fontSize: 12,
          color: "var(--text-main)",
          cursor: "pointer"
        }}>
          Detail Analisis
        </button>
      </motion.div>

      <motion.div 
        className="kpi-grid"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="card"
        >
          <div className="card-title">
            <LeafIcon size={16} color="var(--brand-organic)" /> Total Diproses Hari Ini
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>
              {summary.total_processed}
            </span>
            {summary.total_processed > 0 && (
              <span style={{ color: 'var(--brand-organic)', fontSize: 13, display: 'flex', alignItems: 'center' }}>
                <ArrowUpRight size={14} /> aktif
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>item terklasifikasi</div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="card"
        >
          <div className="card-title">
            <Trash2 size={16} color="#22d3ee" /> Level Tempat Sampah
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{binLevel}</span>
            <span style={{ color: binLevel > 80 ? '#ef4444' : '#22d3ee', fontSize: 13 }}>%</span>
          </div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${binLevel}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
              style={{
                background: binLevel > 80 ? '#ef4444' : binLevel > 60 ? '#f59e0b' : 'var(--brand-organic)'
              }}
            />
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="card"
        >
          <div className="card-title"><Orbit size={16} /> CO2 Dikurangi</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{summary.co2}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>kg</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>estimasi bulan ini</div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="card"
        >
          <div className="card-title"><Cpu size={16} /> Latensi Edge</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{computedLatency}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>ms</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>waktu respons model</div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="card"
        >
          <div className="card-title"><Award size={16} color="#f59e0b" /> Akurasi Model AI</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{computedAccuracy}</span>
            <span style={{ color: '#f59e0b', fontSize: 13 }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{logs.length > 0 ? `dari ${logs.length} klasifikasi` : 'rata-rata 7 hari'}</div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="card"
        >
          <div className="card-title"><ShieldCheck size={16} color="var(--brand-organic)" /> Uptime Sistem</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>99.94</span>
            <span style={{ color: 'var(--brand-organic)', fontSize: 13 }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>30 hari terakhir</div>
        </motion.div>
      </motion.div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
          className="card"
          style={{ padding: 0, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ margin: 0 }}><Focus size={16} /> Mesin Visi AI</div>
            <div style={{ width: 8, height: 8, background: vision.state === 'locked' ? 'var(--brand-organic)' : 'var(--text-muted)', borderRadius: '50%' }} />
          </div>
          <div className="scanner-container" style={{ height: 320 }}>
            {vision.state === 'scanning' && <div className="scan-laser" />}
            <AnimatePresence>
              {vision.state === 'locked' && (
                <motion.div
                  key="bounding-box"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bounding-box"
                  style={{
                    borderColor: 'var(--brand-organic)',
                    top: `${vision.box.top}%`,
                    left: `${vision.box.left}%`,
                    width: `${vision.box.w}%`,
                    height: `${vision.box.h}%`
                  }}
                >
                  <div className="mono" style={{ position: 'absolute', top: -25, left: -1, background: 'var(--brand-organic)', color: 'var(--bg-card)', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                    {(vision.label || 'TERDETEKSI').toUpperCase()} {(vision.prob).toFixed(1)}%
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
          className="card"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div className="card-title"><Activity size={16} /> Reservoir Tempat Sampah</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
            <svg width="200" height="220" viewBox="0 0 100 120">
              <path d="M10,20 L90,20 L80,110 L20,110 Z" fill="none" stroke="var(--border-hover)" strokeWidth="2" strokeLinejoin="round" />
              <path d="M0,20 L100,20" stroke="var(--text-main)" strokeWidth="3" strokeLinecap="round" />
              <path d="M50,20 L50,110" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="4,4" />
              <motion.rect
                x="28" width="44" rx="2" fill="var(--brand-organic)" opacity="0.9"
                initial={{ height: 0, y: 110 }}
                animate={{ 
                  height: (binLevel / 100) * 85,
                  y: 110 - ((binLevel / 100) * 85)
                }}
                transition={{ type: "spring", stiffness: 40 }}
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
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="dashboard-grid-2-1" 
        style={{ marginBottom: 24 }}
      >
        <div className="card" style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">📈 Riwayat Volume Per Jam</div>
          <div style={{ flex: 1, marginTop: 16, marginLeft: -20, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ background: 'transparent' }}>
                <defs>
                  <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-organic)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--brand-organic)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} fill="none" />
                <XAxis dataKey="jam" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-main)' }} itemStyle={{ color: 'var(--text-main)' }} />
                <Area type="monotone" dataKey="volume" stroke="var(--brand-organic)" strokeWidth={2} fill="url(#gVol)" name="Volume (%)" />
                <Brush dataKey="jam" height={30} stroke="var(--brand-organic)" fill="var(--bg-card)" tickFormatter={() => ''} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">🥧 Distribusi Jenis Sampah</div>
          <div style={{ flex: 1, marginTop: 8, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={220}>
              <RPieChart style={{ background: 'transparent' }}>
                <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {distributionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-main)' }} itemStyle={{ color: 'var(--text-main)' }} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {distributionData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />{d.name}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="dashboard-grid-2-1" 
        style={{ marginBottom: 24 }}
      >
        <div className="card" style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">📊 Klasifikasi Harian - 7 Hari Terakhir</div>
          <div style={{ flex: 1, marginTop: 16, marginLeft: -20, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ background: 'transparent' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} fill="none" />
                <XAxis dataKey="hari" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-main)' }} itemStyle={{ color: 'var(--text-main)' }} />
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
            <AnimatePresence initial={false}>
              {displayLogs.map((log, i) => (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-color)' }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-main)' }}>{log.item}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{log.time}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#22d3ee' }}>tempat-sampah</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{log.prob}%</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}