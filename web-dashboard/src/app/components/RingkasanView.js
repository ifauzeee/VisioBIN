"use client";

import React from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush,
  PieChart as RPieChart, Pie, Cell
} from "recharts";
import { 
  Leaf as LeafIcon, Trash2, Orbit, Cpu, Award, ShieldCheck, 
  ArrowUpRight, Video, Focus, Activity, Sparkles, TrendingUp, Clock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  dataVolumePerJam, dataKlasifikasiHarian, dataDistribusiSampah,
  dampakLingkungan, defaultLogs, dataPemrosesanPerJam
} from '../dashboardData';
import { useTranslations } from 'next-intl';


export default React.memo(function RingkasanView({ summary, binLevel, binLevelOrg, binLevelInorg, vision, logs, forecast, wsActive }) {
  const t = useTranslations('dashboard');
  const [filterRange, setFilterRange] = React.useState('all'); // '6h', '12h', '24h', 'all'
  const [brushRange, setBrushRange] = React.useState({ start: 0, end: undefined });

  const handleBrushChange = React.useCallback((range) => {
    if (range) {
      setBrushRange({ start: range.startIndex, end: range.endIndex });
    }
  }, []);

  // Use real data from summary if available, fallback to sample data for visual consistency if empty
  const rawGraphData = summary.volume_history?.length > 0 
    ? summary.volume_history.map(d => ({ jam: d.hour, volume: d.volume }))
    : dataVolumePerJam;

  const graphData = React.useMemo(() => {
    if (filterRange === 'all') return rawGraphData;
    const hours = parseInt(filterRange);
    return rawGraphData.slice(-hours);
  }, [rawGraphData, filterRange]);

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
        text: t.rich('insight_warning', {
          trend: trend,
          station: 'Bin 04',
          day: t('friday'),
          b: (chunks) => <b>{chunks}</b>
        }),
        type: 'warning',
        icon: <TrendingUp size={16} />
      };
    }
    return {
      text: t.rich('insight_success', {
        accuracy: '97.8%',
        co2: co2,
        b: (chunks) => <b>{chunks}</b>
      }),
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
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>{t('ai_insight_title')}</span>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border-hover)" }} />
            <span style={{ fontSize: 11, color: "var(--brand-organic)", fontWeight: 600 }}>{t('just_now')}</span>
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
          {t('analysis_detail')}
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
          className="glass-card"
          style={{ padding: '20px 24px' }}
        >
          <div className="card-title">
            <LeafIcon size={16} color="var(--brand-organic)" /> {t('total_processed_today')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>
              {summary.total_processed}
            </span>
            {summary.total_processed > 0 && (
              <span style={{ color: 'var(--brand-organic)', fontSize: 13, display: 'flex', alignItems: 'center' }}>
                <ArrowUpRight size={14} /> {t('active')}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{t('items_classified')}</div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="glass-card"
          style={{ padding: '20px 24px' }}
        >
          <div className="card-title">
            <Trash2 size={16} color="#22d3ee" /> {t('bin_level')}
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
          className="glass-card"
          style={{ padding: '20px 24px' }}
        >
          <div className="card-title"><Orbit size={16} /> {t('co2_reduced')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{summary.co2}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>kg</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{t('monthly_estimate')}</div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="glass-card"
          style={{ padding: '20px 24px' }}
        >
          <div className="card-title"><Cpu size={16} /> {t('edge_latency')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{computedLatency}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>ms</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{t('response_time')}</div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="glass-card"
          style={{ padding: '20px 24px' }}
        >
          <div className="card-title"><Award size={16} color="#f59e0b" /> {t('ai_accuracy')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>{computedAccuracy}</span>
            <span style={{ color: '#f59e0b', fontSize: 13 }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            {logs.length > 0 
              ? t('classifications_from', { count: logs.length }) 
              : t('avg_7_days')}
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="glass-card"
          style={{ 
            padding: '20px 24px', 
            border: '1px solid rgba(16, 185, 129, 0.2)',
            background: 'linear-gradient(135deg, var(--glass-bg) 0%, rgba(16, 185, 129, 0.05) 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div className="card-title">
            <Clock size={16} color="var(--brand-organic)" /> 
            {t('est_full')}
            {wsActive && (
              <div className="pulse-dot-green" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-organic)', marginLeft: 'auto' }} title="Live Connection Active" />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px' }}>
                {forecast?.hours_until_full_organic ? Math.round(forecast.hours_until_full_organic) : '—'}
              </span>
              <span style={{ color: 'var(--brand-organic)', fontSize: 13, fontWeight: 600 }}>{t('hours')}</span>
            </div>
            
            {/* Sparkline for trend */}
            <div style={{ width: 80, height: 40 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rawGraphData.slice(-10)}>
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="var(--brand-organic)" 
                    fill="var(--brand-organic)" 
                    fillOpacity={0.2} 
                    strokeWidth={2}
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>
            {forecast?.estimated_full_organic 
              ? t('pred_full', { time: new Date(forecast.estimated_full_organic).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) })
              : t('waiting_data')}
          </div>
        </motion.div>
      </motion.div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
          style={{ padding: 0, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ margin: 0 }}><Focus size={16} /> {t('vision_engine')}</div>
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
                    {(vision.label || 'DETECTED').toUpperCase()} {(vision.prob).toFixed(1)}%
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
          className="card"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div className="card-title"><Activity size={16} /> {t('bin_reservoir')}</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
            <svg width="200" height="220" viewBox="0 0 100 120">
              <path d="M10,20 L90,20 L80,110 L20,110 Z" fill="rgba(255,255,255,0.03)" stroke="var(--border-hover)" strokeWidth="2" strokeLinejoin="round" />
              <path d="M0,20 L100,20" stroke="var(--text-main)" strokeWidth="3" strokeLinecap="round" />
              <path d="M50,20 L50,110" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="4,4" />
              
              {/* Organic Fill (Left) */}
              <motion.rect
                x="20" width="28" rx="1" fill="var(--brand-organic)" opacity="0.8"
                initial={{ height: 0, y: 110 }}
                animate={{ 
                  height: (binLevelOrg / 100) * 85,
                  y: 110 - ((binLevelOrg / 100) * 85)
                }}
                transition={{ type: "spring", stiffness: 40 }}
              />
              
              {/* Inorganic Fill (Right) */}
              <motion.rect
                x="52" width="28" rx="1" fill="#3B82F6" opacity="0.8"
                initial={{ height: 0, y: 110 }}
                animate={{ 
                  height: (binLevelInorg / 100) * 85,
                  y: 110 - ((binLevelInorg / 100) * 85)
                }}
                transition={{ type: "spring", stiffness: 40 }}
              />
            </svg>
          </div>
          <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--brand-organic)' }}>{t('bin_capacity')}</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{binLevel}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {binLevel > 80 ? t('empty_soon') : binLevel > 60 ? t('filling_up') : t('normal')}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card" 
          style={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
            <div className="card-title" style={{ margin: 0 }}>📈 {t('volume_history')}</div>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8 }}>
              {['6h', '12h', '24h', 'all'].map(r => (
                <button
                  key={r}
                  onClick={() => {
                    setFilterRange(r);
                    setBrushRange({ start: 0, end: undefined });
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: filterRange === r ? 'var(--brand-organic)' : 'transparent',
                    color: filterRange === r ? '#fff' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, marginTop: 16, marginLeft: -20, minWidth: 0, position: 'relative' }}>
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
                <Area type="monotone" dataKey="volume" stroke="var(--brand-organic)" strokeWidth={2} fill="url(#gVol)" name="Volume (%)" isAnimationActive={true} />
                <Brush 
                  dataKey="jam" 
                  height={30} 
                  stroke="var(--brand-organic)" 
                  fill="var(--bg-card)" 
                  tickFormatter={() => ''} 
                  startIndex={brushRange.start}
                  endIndex={brushRange.end}
                  onChange={handleBrushChange}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card" 
          style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}
        >
          <div className="card-title">🥧 {t('waste_distribution')}</div>
          <div style={{ flex: 1, marginTop: 8, minWidth: 0, position: 'relative' }}>
            <ResponsiveContainer width="100%" height={220}>
              <RPieChart style={{ background: 'transparent' }}>
                <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} isAnimationActive={true}>
                  {distributionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-main)' }} itemStyle={{ color: 'var(--text-main)' }} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, padding: '0 4px' }}>
            {(() => {
              const total = distributionData.reduce((acc, d) => acc + d.value, 0);
              return distributionData.map(d => {
                const percent = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{d.name === 'Organik' ? t('organic') : d.name === 'Anorganik' ? t('inorganic') : d.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginLeft: 4 }}>{percent}%</span>
                  </div>
                );
              });
            })()}
          </div>
        </motion.div>
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card" 
          style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}
        >
          <div className="card-title">📊 {t('daily_classification')}</div>
          <div style={{ flex: 1, marginTop: 16, marginLeft: -20, minWidth: 0, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ background: 'transparent' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} fill="none" />
                <XAxis dataKey="hari" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-main)' }} itemStyle={{ color: 'var(--text-main)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="organik" fill="var(--brand-organic)" radius={[4, 4, 0, 0]} name={t('organic')} isAnimationActive={true} />
                <Bar dataKey="anorganik" fill="var(--brand-inorganic)" radius={[4, 4, 0, 0]} name={t('inorganic')} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card" 
          style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}
        >
          <div className="card-title"><Activity size={16} /> {t('recent_activity')}</div>
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
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#22d3ee' }}>{t('bin_reservoir').toLowerCase()}</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{log.prob}%</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});