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
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  hasClassificationData,
  mapDailyStats,
  mapVolumeHistory,
} from '../utils/realDataTransforms.mjs';
import { useTranslations } from 'next-intl';
import { APP_CONFIG } from '../config/appConfig';

// A simple rolling number counter using Framer Motion animate
function RollingNumber({ value, duration = 1 }) {
  const nodeRef = React.useRef();
  const prevValueRef = React.useRef(0);

  React.useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const start = prevValueRef.current;
    const end = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(end)) {
      node.textContent = value;
      return;
    }

    const controls = animate(start, end, {
      duration: duration,
      ease: "easeOut",
      onUpdate(current) {
        if (Number.isInteger(end)) {
          node.textContent = Math.round(current);
        } else {
          node.textContent = current.toFixed(1);
        }
      }
    });

    prevValueRef.current = end;
    return () => controls.stop();
  }, [value, duration]);

  return <span ref={nodeRef}>{value}</span>;
}

// Custom tooltip for weekly trend daily stats
const CustomWeeklyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const organik = payload.find(p => p.dataKey === 'organik')?.value || 0;
    const anorganik = payload.find(p => p.dataKey === 'anorganik')?.value || 0;
    const total = organik + anorganik;
    const ratio = anorganik > 0 ? `${(organik / anorganik).toFixed(2)}:1` : '—';
    const organicPercent = total > 0 ? Math.round((organik / total) * 100) : 0;
    const inorganicPercent = total > 0 ? Math.round((anorganik / total) * 100) : 0;

    return (
      <div className="custom-tooltip" style={{
        background: "rgba(10, 10, 10, 0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--border-hover)",
        borderRadius: "12px",
        padding: "12px 16px",
        color: "var(--text-main)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
      }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "var(--text-main)" }}>{label}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
            <span style={{ color: "var(--brand-organic)", fontWeight: 500 }}>🟢 Organik:</span>
            <span className="mono" style={{ fontWeight: 600 }}>{organik} ({organicPercent}%)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
            <span style={{ color: "var(--brand-inorganic)", fontWeight: 500 }}>🔵 Anorganik:</span>
            <span className="mono" style={{ fontWeight: 600 }}>{anorganik} ({inorganicPercent}%)</span>
          </div>
          <div style={{ height: 1, background: "var(--border-color)", margin: "4px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
            <span style={{ color: "var(--text-muted)" }}>Total Sampah:</span>
            <span className="mono" style={{ fontWeight: 600 }}>{total}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
            <span style={{ color: "var(--text-muted)" }}>Rasio O/A:</span>
            <span className="mono" style={{ fontWeight: 600, color: "#8B5CF6" }}>{ratio}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip for volume history
const CustomVolumeTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const volume = payload[0].value;
    let status = 'Aman';
    let color = 'var(--brand-organic)';
    if (volume > 80) {
      status = 'Penuh';
      color = '#ef4444';
    } else if (volume > 60) {
      status = 'Waspada';
      color = '#f59e0b';
    }

    return (
      <div className="custom-tooltip" style={{
        background: "rgba(10, 10, 10, 0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--border-hover)",
        borderRadius: "12px",
        padding: "10px 14px",
        color: "var(--text-main)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
      }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Waktu: {label}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "var(--text-muted)" }}>Tingkat Kepenuhan:</span>
            <span className="mono" style={{ fontWeight: 600, color: "var(--brand-organic)" }}>{volume}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "var(--text-muted)" }}>Status:</span>
            <span style={{ fontWeight: 600, color: color }}>{status}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

function RingkasanSkeleton() {
  return (
    <div style={{ opacity: 0.8 }}>
      {/* AI Insight Placeholder */}
      <div className="card skeleton-shimmer" style={{ height: 72, marginBottom: 24, borderRadius: 16 }} />

      {/* KPI Grid Placeholders */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card skeleton-shimmer" style={{ height: 120, borderRadius: 16 }} />
        ))}
      </div>

      {/* Camera & Reservoir Grid */}
      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card skeleton-shimmer" style={{ height: 360 }} />
        <div className="card skeleton-shimmer" style={{ height: 360 }} />
      </div>

      {/* History & Distribution Grid */}
      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card skeleton-shimmer" style={{ height: 400 }} />
        <div className="card skeleton-shimmer" style={{ height: 400 }} />
      </div>

      {/* Daily & Recent Activity Grid */}
      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card skeleton-shimmer" style={{ height: 350 }} />
        <div className="card skeleton-shimmer" style={{ height: 350 }} />
      </div>
    </div>
  );
}

export default React.memo(function RingkasanView({ summary, binLevel, binLevelOrg, binLevelInorg, vision, logs, forecast, wsActive, loading }) {
  if (loading) {
    return <RingkasanSkeleton />;
  }
  const t = useTranslations('dashboard');
  const [filterRange, setFilterRange] = React.useState('all'); // '6h', '12h', '24h', 'all'
  const [brushRange, setBrushRange] = React.useState({ start: 0, end: undefined });

  const handleBrushChange = React.useCallback((range) => {
    if (range) {
      setBrushRange({ start: range.startIndex, end: range.endIndex });
    }
  }, []);

  const rawGraphData = mapVolumeHistory(summary.volume_history || []);

  const graphData = React.useMemo(() => {
    if (filterRange === 'all') return rawGraphData;
    const hours = parseInt(filterRange);
    return rawGraphData.slice(-hours);
  }, [rawGraphData, filterRange]);

  const dailyStats = mapDailyStats(summary.daily_stats || []);

  const hasClassifications = hasClassificationData(summary, logs);

  const distributionData = hasClassifications && summary.distribution?.length > 0
    ? summary.distribution
    : [];

  const computedAccuracy = logs.length > 0
    ? (logs.reduce((acc, l) => acc + (l.prob || 0), 0) / logs.length).toFixed(1)
    : '0.0';

  const computedLatency = logs.length > 0
    ? Math.round(logs.reduce((acc, l) => acc + (l.inference_ms || 0), 0) / logs.length)
    : summary.latency || 0;

  const generateInsight = () => {
    const total = summary.total_processed || 0;
    const co2 = summary.co2 || 0;
    const trend = 12;

    if (!hasClassifications && !rawGraphData.length) {
      return {
        text: t.rich('insight_waiting', {
          b: (chunks) => <b>{chunks}</b>
        }),
        type: 'muted',
        icon: <Activity size={16} />
      };
    }
    
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
        accuracy: `${computedAccuracy}%`,
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
          background: insight.type === 'success'
            ? "rgba(16,185,129,0.1)"
            : insight.type === 'warning'
              ? "rgba(245,158,11,0.1)"
              : "rgba(148,163,184,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: insight.type === 'success' ? "var(--brand-organic)" : insight.type === 'warning' ? "#f59e0b" : "var(--text-muted)"
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
          whileHover={{ y: -6, scale: 1.015, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass-card"
          style={{ padding: '20px 24px', cursor: 'pointer' }}
        >
          <div className="card-title">
            <LeafIcon size={16} color="var(--brand-organic)" /> {t('total_processed_today')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>
              <RollingNumber value={summary.total_processed} />
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
          whileHover={{ y: -6, scale: 1.015, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass-card"
          style={{ padding: '20px 24px', cursor: 'pointer' }}
        >
          <div className="card-title">
            <Trash2 size={16} color="#22d3ee" /> {t('bin_level')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>
              <RollingNumber value={binLevel} />
            </span>
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
          whileHover={{ y: -6, scale: 1.015, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass-card"
          style={{ padding: '20px 24px', cursor: 'pointer' }}
        >
          <div className="card-title"><Orbit size={16} /> {t('co2_reduced')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>
              <RollingNumber value={summary.co2} />
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>kg</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{t('monthly_estimate')}</div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ y: -6, scale: 1.015, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass-card"
          style={{ padding: '20px 24px', cursor: 'pointer' }}
        >
          <div className="card-title"><Cpu size={16} /> {t('edge_latency')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>
              <RollingNumber value={computedLatency} />
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>ms</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{t('response_time')}</div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ y: -6, scale: 1.015, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass-card"
          style={{ padding: '20px 24px', cursor: 'pointer' }}
        >
          <div className="card-title"><Award size={16} color="#f59e0b" /> {t('ai_accuracy')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>
              <RollingNumber value={computedAccuracy} />
            </span>
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
          whileHover={{ y: -6, scale: 1.015, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass-card"
          style={{ 
            padding: '20px 24px', 
            border: '1px solid rgba(16, 185, 129, 0.2)',
            background: 'linear-gradient(135deg, var(--glass-bg) 0%, rgba(16, 185, 129, 0.05) 100%)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer'
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
                {forecast?.hours_until_full_organic ? (
                  <RollingNumber value={Math.round(forecast.hours_until_full_organic)} />
                ) : '—'}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={APP_CONFIG.cameraStreamUrl}
              alt="Live Camera"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {vision.state === 'scanning' && <div className="scan-laser" />}
            <AnimatePresence>
              {vision.state === 'locked' && vision.box && (
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
            {graphData.length ? (
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
                  <Tooltip content={<CustomVolumeTooltip />} />
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
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Belum ada data telemetry.
              </div>
            )}
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
            {distributionData.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <RPieChart style={{ background: 'transparent' }}>
                  <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} isAnimationActive={true}>
                    {distributionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-main)' }} itemStyle={{ color: 'var(--text-main)' }} />
                </RPieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Belum ada data klasifikasi.
              </div>
            )}
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
            {dailyStats.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ background: 'transparent' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} fill="none" />
                  <XAxis dataKey="hari" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomWeeklyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="organik" fill="var(--brand-organic)" radius={[4, 4, 0, 0]} name={t('organic')} isAnimationActive={true} />
                  <Bar dataKey="anorganik" fill="var(--brand-inorganic)" radius={[4, 4, 0, 0]} name={t('inorganic')} isAnimationActive={true} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Belum ada klasifikasi harian.
              </div>
            )}
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
              {logs.length ? logs.map((log, i) => (
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
              )) : (
                <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Belum ada aktivitas klasifikasi.
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});
