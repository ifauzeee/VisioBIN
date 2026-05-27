"use client";

import React from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Brush,
  PieChart as RPieChart, Pie, Cell
} from "recharts";
import { 
  Leaf as LeafIcon, Trash2, Orbit, Cpu, Award, ShieldCheck, 
  ArrowUpRight, Video, Focus, Activity, Sparkles, TrendingUp, Clock, X, Percent, Tag,
  GripVertical, Eye, EyeOff, HelpCircle, Edit, Check
} from "lucide-react";
import { motion, AnimatePresence, animate, Reorder } from "framer-motion";
import {
  hasClassificationData,
  mapDailyStats,
  mapVolumeHistory,
} from '../utils/realDataTransforms.mjs';
import { useTranslations, useLocale } from 'next-intl';
import { APP_CONFIG } from '../config/appConfig';

const DEFAULT_WIDGET_ORDER = ['insight', 'kpi', 'vision_reservoir', 'history_distribution', 'daily_activity'];
const DEFAULT_VISIBLE_WIDGETS = {
  insight: true,
  kpi: true,
  vision_reservoir: true,
  history_distribution: true,
  daily_activity: true,
};

function normalizeWidgetOrder(value) {
  if (!Array.isArray(value)) return DEFAULT_WIDGET_ORDER;

  const known = new Set(DEFAULT_WIDGET_ORDER);
  const cleaned = value.filter((item, index) => known.has(item) && value.indexOf(item) === index);
  const missing = DEFAULT_WIDGET_ORDER.filter((item) => !cleaned.includes(item));
  const nextOrder = [...cleaned, ...missing];

  return nextOrder.length ? nextOrder : DEFAULT_WIDGET_ORDER;
}

function normalizeVisibleWidgets(value) {
  const normalized = { ...DEFAULT_VISIBLE_WIDGETS };

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    DEFAULT_WIDGET_ORDER.forEach((key) => {
      if (typeof value[key] === 'boolean') {
        normalized[key] = value[key];
      }
    });
  }

  if (!DEFAULT_WIDGET_ORDER.some((key) => normalized[key])) {
    return DEFAULT_VISIBLE_WIDGETS;
  }

  return normalized;
}

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

function ChartFrame({ children, height = 260, minHeight, style }) {
  const frameRef = React.useRef(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateReady = () => {
      const { width, height: measuredHeight } = frame.getBoundingClientRect();
      setSize({
        width: Math.max(0, Math.floor(width)),
        height: Math.max(0, Math.floor(measuredHeight)),
      });
    };

    updateReady();
    const observer = new ResizeObserver(updateReady);
    observer.observe(frame);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      style={{
        width: '100%',
        height,
        minHeight: minHeight ?? height,
        minWidth: 0,
        position: 'relative',
        ...style,
      }}
    >
      {size.width > 0 && size.height > 0
        ? typeof children === 'function'
          ? children(size)
          : children
        : null}
    </div>
  );
}

function OnboardingTour({ step, steps, onNext, onPrev, onSkip }) {
  if (step < 0 || step >= steps.length) return null;
  const current = steps[step];
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 2000,
      width: 320,
      background: "linear-gradient(135deg, rgba(20, 20, 24, 0.95) 0%, rgba(10, 10, 12, 0.98) 100%)",
      border: "1px solid var(--brand-organic)",
      borderRadius: 16,
      padding: 20,
      boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
      color: "#fff",
      backdropFilter: "blur(12px)"
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--brand-organic)" }}>
          ✨ {current.title}
        </h4>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {step + 1} / {steps.length}
        </span>
      </div>
      <p style={{ margin: "0 0 16px 0", fontSize: 13, lineHeight: 1.5, color: "var(--text-muted)" }}>
        {current.content}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={onSkip} 
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}
        >
          Lewati
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && (
            <button 
              onClick={onPrev} 
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: 6, color: "#fff", padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
            >
              Kembali
            </button>
          )}
          <button 
            onClick={onNext} 
            style={{ background: "var(--brand-organic)", border: "none", borderRadius: 6, color: "#fff", padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {step === steps.length - 1 ? "Selesai" : "Lanjut"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(function RingkasanView({ summary, binLevel, binLevelOrg, binLevelInorg, vision, logs, forecast, wsActive, loading }) {
  const safeSummary = summary || {};
  const safeLogs = logs || [];
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [filterRange, setFilterRange] = React.useState('all'); // '6h', '12h', '24h', 'all'
  const [analysisDetailOpen, setAnalysisDetailOpen] = React.useState(false);
  const [brushRange, setBrushRange] = React.useState({ start: 0, end: undefined });
  const [widgetOrder, setWidgetOrder] = React.useState(DEFAULT_WIDGET_ORDER);
  const [visibleWidgets, setVisibleWidgets] = React.useState(DEFAULT_VISIBLE_WIDGETS);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [tourStep, setTourStep] = React.useState(-1);

  React.useEffect(() => {
    const savedOrder = localStorage.getItem("visiobin_widget_order");
    const savedVisible = localStorage.getItem("visiobin_visible_widgets");
    const hasSeenTour = localStorage.getItem("visiobin_onboarded");
    let nextOrder = DEFAULT_WIDGET_ORDER;
    let nextVisible = DEFAULT_VISIBLE_WIDGETS;

    if (savedOrder) {
      try { nextOrder = normalizeWidgetOrder(JSON.parse(savedOrder)); } catch (e) {}
    }
    if (savedVisible) {
      try { nextVisible = normalizeVisibleWidgets(JSON.parse(savedVisible)); } catch (e) {}
    }

    setWidgetOrder(nextOrder);
    setVisibleWidgets(nextVisible);
    saveLayout(nextOrder, nextVisible);

    if (!hasSeenTour) {
      setTourStep(0);
    }
  }, []);

  const saveLayout = (newOrder, newVisible) => {
    localStorage.setItem("visiobin_widget_order", JSON.stringify(normalizeWidgetOrder(newOrder)));
    localStorage.setItem("visiobin_visible_widgets", JSON.stringify(normalizeVisibleWidgets(newVisible)));
  };

  const tourSteps = [
    {
      target: ".sidebar",
      title: locale === 'id' ? "Navigasi Menu Utama" : "Main Navigation",
      content: locale === 'id' 
        ? "Gunakan panel navigasi kiri untuk mengakses berbagai fitur seperti peta stasiun, chat komunitas, analitik, dan log maintenance."
        : "Use the left navigation panel to access features like map stations, community chat, analytics, and maintenance logs.",
    },
    {
      target: ".kpi-grid",
      title: locale === 'id' ? "Metrik Ringkasan Utama" : "Core Metrics Overview",
      content: locale === 'id'
        ? "Di sini ditampilkan total scan hari ini, tingkat keterisian stasiun, CO2 tereduksi, latensi pemrosesan edge, akurasi AI, dan estimasi stasiun penuh."
        : "This section shows today's scan volume, average fill levels, reduced CO2 emissions, edge latency, AI accuracy, and fill-up predictions.",
    },
    {
      target: ".scanner-container",
      title: locale === 'id' ? "AI Vision Engine Live" : "Live AI Vision Engine",
      content: locale === 'id'
        ? "Feed kamera real-time dari Raspberry Pi stasiun sampah. Kotak pembatas visual akan otomatis mendeteksi objek sampah organik/anorganik."
        : "A real-time camera stream directly from the waste station. Custom bounding boxes dynamically outline detected organic and inorganic waste.",
    },
    {
      target: ".recent-activity-panel",
      title: locale === 'id' ? "Aktivitas Terbaru" : "Recent Scan Activity",
      content: locale === 'id'
        ? "Log riwayat pemrosesan deteksi sampah yang terjadi di seluruh stasiun secara langsung."
        : "A scrolling log of incoming trash detection classifications from all sensor devices in real-time.",
    }
  ];

  React.useEffect(() => {
    if (tourStep < 0 || tourStep >= tourSteps.length) {
      document.querySelectorAll(".tour-highlight").forEach(el => el.classList.remove("tour-highlight"));
      return;
    }
    document.querySelectorAll(".tour-highlight").forEach(el => el.classList.remove("tour-highlight"));
    const step = tourSteps[tourStep];
    const el = document.querySelector(step.target);
    if (el) {
      el.classList.add("tour-highlight");
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [tourStep]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setAnalysisDetailOpen(false);
      }
    };
    if (analysisDetailOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [analysisDetailOpen]);



  const handleBrushChange = React.useCallback((range) => {
    if (range) {
      setBrushRange({ start: range.startIndex, end: range.endIndex });
    }
  }, []);

  const rawGraphData = mapVolumeHistory(safeSummary.volume_history || []);

  const graphData = React.useMemo(() => {
    if (filterRange === 'all') return rawGraphData;
    const hours = parseInt(filterRange);
    return rawGraphData.slice(-hours);
  }, [rawGraphData, filterRange]);

  const renderedWidgetIds = React.useMemo(() => {
    return normalizeWidgetOrder(widgetOrder).filter((widgetId) => visibleWidgets[widgetId]);
  }, [widgetOrder, visibleWidgets]);

  if (loading) {
    return <RingkasanSkeleton />;
  }

  const dailyStats = mapDailyStats(safeSummary.daily_stats || []);

  const hasClassifications = hasClassificationData(safeSummary, safeLogs);

  const distributionData = hasClassifications && safeSummary.distribution?.length > 0
    ? safeSummary.distribution
    : [];

  const computedAccuracy = safeLogs.length > 0
    ? (safeLogs.reduce((acc, l) => acc + (l.prob || 0), 0) / safeLogs.length).toFixed(1)
    : '0.0';

  const computedLatency = safeLogs.length > 0
    ? Math.round(safeLogs.reduce((acc, l) => acc + (l.inference_ms || 0), 0) / safeLogs.length)
    : safeSummary.latency || 0;

  const generateInsight = () => {
    const total = safeSummary.total_processed || 0;
    const co2 = safeSummary.co2 || 0;
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

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'insight':
        return (
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
        <button 
          onClick={() => setAnalysisDetailOpen(true)}
          style={{ 
            background: "transparent", 
            border: "1px solid var(--border-color)", 
            padding: "8px 16px", 
            borderRadius: 8,
            fontSize: 12,
            color: "var(--text-main)",
            cursor: "pointer"
          }}
        >
          {t('analysis_detail')}
        </button>
      </motion.div>
        );
      case 'kpi':
        return (
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
              <RollingNumber value={safeSummary.total_processed || 0} />
            </span>
            {(safeSummary.total_processed || 0) > 0 && (
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
              <RollingNumber value={safeSummary.co2 || 0} />
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
            {safeLogs.length > 0
              ? t('classifications_from', { count: safeLogs.length })
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
              <div className="pulse-dot-green" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-organic)', marginLeft: 'auto' }} title={locale === 'id' ? "Koneksi Live Aktif" : "Live Connection Active"} />
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
            <ChartFrame height={40} style={{ width: 80, flex: '0 0 80px' }}>
              {({ width, height }) => (
                <AreaChart width={width} height={height} data={rawGraphData.slice(-10)}>
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
              )}
            </ChartFrame>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>
            {forecast?.estimated_full_organic 
              ? t('pred_full', { time: new Date(forecast.estimated_full_organic).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) })
              : t('waiting_data')}
          </div>
        </motion.div>
      </motion.div>
        );
      case 'vision_reservoir':
        return (
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
        );
      case 'history_distribution':
        return (
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
          <ChartFrame height={300} style={{ flex: '1 1 300px', marginTop: 16, marginLeft: -20 }}>
            {graphData.length ? (
              ({ width, height }) => (
                <AreaChart width={width} height={height} data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ background: 'transparent' }}>
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
              )
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Belum ada data telemetry.
              </div>
            )}
          </ChartFrame>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card" 
          style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}
        >
          <div className="card-title">🥧 {t('waste_distribution')}</div>
          <ChartFrame height={220} style={{ flex: '0 0 220px', marginTop: 8 }}>
            {distributionData.length ? (
              ({ width, height }) => (
                <RPieChart width={width} height={height} style={{ background: 'transparent' }}>
                  <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} isAnimationActive={true}>
                    {distributionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-main)' }} itemStyle={{ color: 'var(--text-main)' }} />
                </RPieChart>
              )
            ) : (
              <div style={{ height: 220, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Belum ada data klasifikasi.
              </div>
            )}
          </ChartFrame>
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
        );
      case 'daily_activity':
        return (
          <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card recent-activity-panel" 
          style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}
        >
          <div className="card-title">📊 {t('daily_classification')}</div>
          <ChartFrame height={250} style={{ flex: '1 1 250px', marginTop: 16, marginLeft: -20 }}>
            {dailyStats.length ? (
              ({ width, height }) => (
                <BarChart width={width} height={height} data={dailyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ background: 'transparent' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} fill="none" />
                  <XAxis dataKey="hari" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomWeeklyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="organik" fill="var(--brand-organic)" radius={[4, 4, 0, 0]} name={t('organic')} isAnimationActive={true} />
                  <Bar dataKey="anorganik" fill="var(--brand-inorganic)" radius={[4, 4, 0, 0]} name={t('inorganic')} isAnimationActive={true} />
                </BarChart>
              )
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Belum ada klasifikasi harian.
              </div>
            )}
          </ChartFrame>
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
              {safeLogs.length ? safeLogs.map((log, i) => (
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
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <style jsx global>{`
        .tour-highlight {
          position: relative !important;
          z-index: 1500 !important;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 15px 5px var(--brand-organic) !important;
          transition: all 0.3s ease !important;
          background: var(--bg-card) !important;
          border-radius: 16px !important;
        }
      `}</style>

      {/* Onboarding Tour Dialog */}
      <OnboardingTour 
        step={tourStep} 
        steps={tourSteps} 
        onNext={() => {
          if (tourStep === tourSteps.length - 1) {
            localStorage.setItem("visiobin_onboarded", "true");
            setTourStep(-1);
          } else {
            setTourStep(tourStep + 1);
          }
        }} 
        onPrev={() => setTourStep(tourStep - 1)} 
        onSkip={() => {
          localStorage.setItem("visiobin_onboarded", "true");
          setTourStep(-1);
        }} 
      />

      {/* Configuration Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          {locale === 'id' ? 'Ringkasan Dashboard' : 'Dashboard Summary'}
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setTourStep(0)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', 
              borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--text-main)', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            aria-label={locale === 'id' ? 'Mulai panduan fitur' : 'Start onboarding tour'}
          >
            <HelpCircle size={14} color="var(--brand-organic)" />
            {locale === 'id' ? 'Panduan Fitur' : 'Tour Guide'}
          </button>
          
          <button 
            onClick={() => {
              if (isEditMode) {
                saveLayout(widgetOrder, visibleWidgets);
              }
              setIsEditMode(!isEditMode);
            }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6,
              background: isEditMode ? 'var(--brand-organic)' : 'rgba(255,255,255,0.03)', 
              border: isEditMode ? 'none' : '1px solid var(--border-color)', 
              borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#fff', cursor: 'pointer',
              fontWeight: 600, transition: 'all 0.2s'
            }}
            aria-label={isEditMode ? 'Selesai kustomisasi layout' : 'Kustomisasi layout dashboard'}
          >
            {isEditMode ? <Check size={14} /> : <Edit size={14} />}
            {isEditMode ? (locale === 'id' ? 'Selesai' : 'Selesai') : (locale === 'id' ? 'Edit Layout' : 'Edit Layout')}
          </button>
        </div>
      </div>

      {/* Edit Mode Customization Controls Panel */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ 
              background: 'var(--bg-hover)', border: '1px dashed var(--border-hover)',
              borderRadius: 16, padding: 20, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12,
              overflow: 'hidden'
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {locale === 'id' ? 'Tampilkan / Sembunyikan Widget' : 'Show / Hide Widgets'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {Object.keys(visibleWidgets).map(key => {
                const labelMap = {
                  insight: 'AI Insight Narrative',
                  kpi: 'KPI Cards Grid',
                  vision_reservoir: 'AI Video & Reservoir',
                  history_distribution: 'Volume Trend & Distribution',
                  daily_activity: 'Daily Charts & Recent Activity'
                };
                const isVis = visibleWidgets[key];
                return (
                  <button
                    key={key}
                    onClick={() => {
                      const updated = { ...visibleWidgets, [key]: !isVis };
                      setVisibleWidgets(updated);
                      saveLayout(widgetOrder, updated);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: isVis ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                      border: '1px solid ' + (isVis ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'),
                      borderRadius: 8, padding: '6px 12px', fontSize: 12,
                      color: isVis ? 'var(--brand-organic)' : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    aria-label={'Toggle ' + labelMap[key]}
                  >
                    {isVis ? <Eye size={14} /> : <EyeOff size={14} />}
                    {labelMap[key]}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              💡 {locale === 'id' ? 'Seret / drag widget di bawah untuk mengurutkan tata letak sesuai keinginan.' : 'Drag widgets below to rearrange layout as desired.'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Reorder.Group 
        axis="y" 
        values={renderedWidgetIds}
        onReorder={(newOrder) => {
          const hiddenWidgetIds = normalizeWidgetOrder(widgetOrder).filter((widgetId) => !visibleWidgets[widgetId]);
          const nextOrder = normalizeWidgetOrder([...newOrder, ...hiddenWidgetIds]);
          setWidgetOrder(nextOrder);
          saveLayout(nextOrder, visibleWidgets);
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 24, listStyle: 'none', padding: 0, margin: 0 }}
      >
        {renderedWidgetIds.map((widgetId) => {
          return (
            <Reorder.Item 
              key={widgetId} 
              value={widgetId}
              dragListener={isEditMode}
              style={{ position: 'relative' }}
            >
              {isEditMode && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  border: '2px dashed var(--brand-organic)', borderRadius: 16,
                  background: 'rgba(16,185,129,0.01)', pointerEvents: 'none', zIndex: 10
                }} />
              )}
              {isEditMode && (
                <div style={{
                  position: 'absolute', top: -12, left: 16, background: 'var(--brand-organic)',
                  color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  display: 'flex', alignItems: 'center', gap: 4, zIndex: 11, cursor: 'grab'
                }}>
                  <GripVertical size={10} />
                  {widgetId === 'insight' ? 'AI Insight Narrative' : widgetId === 'kpi' ? 'KPI Cards Grid' : widgetId === 'vision_reservoir' ? 'AI Video & Reservoir' : widgetId === 'history_distribution' ? 'Volume Trend & Distribution' : 'Daily Charts & Recent Activity'}
                </div>
              )}
              <div style={{ opacity: isEditMode ? 0.7 : 1 }}>
                {renderWidget(widgetId)}
              </div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      {/* Analysis Detail Modal */}
      <AnimatePresence>
        {analysisDetailOpen && (
          <div className="modal-overlay" style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }} onClick={() => setAnalysisDetailOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="modal-box"
              onClick={e => e.stopPropagation()}
              style={{
                background: "linear-gradient(135deg, rgba(24, 24, 28, 0.9) 0%, rgba(14, 14, 18, 0.95) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "20px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                maxWidth: "500px",
                width: "90%",
                padding: "28px",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Decorative radial glows */}
              <div style={{
                position: "absolute",
                top: "-10%",
                right: "-10%",
                width: "150px",
                height: "150px",
                background: safeLogs.length > 0 && safeLogs[0].item === 'organic' ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
                filter: "blur(40px)",
                borderRadius: "50%",
                pointerEvents: "none"
              }} />

              {/* Header */}
              <div style={{ 
                paddingBottom: "16px", 
                marginBottom: "24px", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
              }}>
                <h3 style={{ 
                  margin: 0, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 10, 
                  fontSize: "20px", 
                  fontWeight: 800, 
                  color: "#fff",
                  letterSpacing: "-0.02em"
                }}>
                  <Sparkles size={20} color={safeLogs.length > 0 && safeLogs[0].item === 'organic' ? "#10b981" : "#3b82f6"} />
                  {t('analysis_detail')}
                </h3>
                <button 
                  onClick={() => setAnalysisDetailOpen(false)}
                  style={{ 
                    background: "rgba(255, 255, 255, 0.04)", 
                    border: "1px solid rgba(255, 255, 255, 0.08)", 
                    borderRadius: "50%", 
                    color: "rgba(255, 255, 255, 0.6)", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)"; }}
                >
                  <X size={16} />
                </button>
              </div>

              {safeLogs.length > 0 ? (
                <div>
                  {/* Camera Snap Frame (HUD Viewfinder) */}
                  <div style={{ 
                    position: 'relative', 
                    height: '240px', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    marginBottom: '24px', 
                    border: "1px solid rgba(255, 255, 255, 0.08)", 
                    background: "#08080a",
                    boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)"
                  }}>
                    {/* Grid Overlay for high-tech HUD look */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                      pointerEvents: "none",
                      zIndex: 2
                    }} />

                    {/* Scanner horizontal line animation */}
                    <motion.div 
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      style={{
                        position: 'absolute',
                        left: 0,
                        width: '100%',
                        height: '2px',
                        background: safeLogs[0].item === 'organic'
                          ? "linear-gradient(90deg, transparent, #10b981, transparent)" 
                          : "linear-gradient(90deg, transparent, #3b82f6, transparent)",
                        boxShadow: safeLogs[0].item === 'organic'
                          ? "0 0 8px #10b981" 
                          : "0 0 8px #3b82f6",
                        pointerEvents: 'none',
                        zIndex: 3
                      }}
                    />

                    {/* Camera snapshot */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={APP_CONFIG.cameraStreamUrl}
                      alt="Tangkapan Kamera"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, opacity: 0.85 }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    
                    {/* Viewfinder corner brackets */}
                    <div style={{ position: 'absolute', top: 12, left: 12, width: 10, height: 10, borderTop: '2px solid rgba(255,255,255,0.4)', borderLeft: '2px solid rgba(255,255,255,0.4)', zIndex: 2 }} />
                    <div style={{ position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderTop: '2px solid rgba(255,255,255,0.4)', borderRight: '2px solid rgba(255,255,255,0.4)', zIndex: 2 }} />
                    <div style={{ position: 'absolute', bottom: 12, left: 12, width: 10, height: 10, borderBottom: '2px solid rgba(255,255,255,0.4)', borderLeft: '2px solid rgba(255,255,255,0.4)', zIndex: 2 }} />
                    <div style={{ position: 'absolute', bottom: 12, right: 12, width: 10, height: 10, borderBottom: '2px solid rgba(255,255,255,0.4)', borderRight: '2px solid rgba(255,255,255,0.4)', zIndex: 2 }} />

                    {/* Blinking Live Indicator */}
                    <div style={{ 
                      position: 'absolute', 
                      top: 12, 
                      left: 12, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      background: 'rgba(0,0,0,0.6)', 
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.8)',
                      letterSpacing: '0.05em',
                      zIndex: 4
                    }}>
                      <motion.span 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} 
                      />
                      CAM01 LIVE
                    </div>

                    {/* Vision bounding box overlays */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      style={{
                        position: 'absolute',
                        top: '20%',
                        left: '25%',
                        width: '50%',
                        height: '60%',
                        border: `2px solid ${safeLogs[0].item === 'organic' ? '#10b981' : '#3b82f6'}`,
                        borderRadius: '8px',
                        boxShadow: `0 0 20px ${safeLogs[0].item === 'organic' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}, inset 0 0 10px ${safeLogs[0].item === 'organic' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)'}`,
                        pointerEvents: 'none',
                        zIndex: 4
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '-24px',
                        left: '-2px',
                        background: safeLogs[0].item === 'organic' ? '#10b981' : '#3b82f6',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                        letterSpacing: '0.02em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {safeLogs[0].item === 'organic' ? t('organic') : t('inorganic')} ({safeLogs[0].prob}%)
                      </span>
                    </motion.div>
                  </div>

                  {/* Metadata Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    
                    {/* Item 1: Status */}
                    <motion.div 
                      whileHover={{ y: -2, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
                      style={{ 
                        padding: '16px', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                    >
                      <div style={{ 
                        background: safeLogs[0].item === 'organic' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '8px', 
                        padding: '8px',
                        color: safeLogs[0].item === 'organic' ? '#10b981' : '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Tag size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>Hasil / Status</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '4px', color: safeLogs[0].item === 'organic' ? '#10b981' : '#3b82f6', textTransform: 'capitalize' }}>
                          {safeLogs[0].item === 'organic' ? t('organic') : t('inorganic')}
                        </div>
                      </div>
                    </motion.div>

                    {/* Item 2: Confidence */}
                    <motion.div 
                      whileHover={{ y: -2, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
                      style={{ 
                        padding: '16px', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                    >
                      <div style={{ 
                        background: 'rgba(235, 166, 11, 0.1)', 
                        borderRadius: '8px', 
                        padding: '8px',
                        color: '#eb7e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Percent size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>Kepercayaan (Confidence)</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '4px', color: '#fff' }}>
                          {safeLogs[0].prob}%
                        </div>
                      </div>
                    </motion.div>

                    {/* Item 3: Latency */}
                    <motion.div 
                      whileHover={{ y: -2, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
                      style={{ 
                        padding: '16px', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                    >
                      <div style={{ 
                        background: 'rgba(139, 92, 246, 0.1)', 
                        borderRadius: '8px', 
                        padding: '8px',
                        color: '#a78bfa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Cpu size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>Latensi Inferensi</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '4px', color: '#fff' }}>
                          {safeLogs[0].inference_ms} ms
                        </div>
                      </div>
                    </motion.div>

                    {/* Item 4: Time */}
                    <motion.div 
                      whileHover={{ y: -2, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
                      style={{ 
                        padding: '16px', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                    >
                      <div style={{ 
                        background: 'rgba(6, 182, 212, 0.1)', 
                        borderRadius: '8px', 
                        padding: '8px',
                        color: '#22d3ee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Clock size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>Waktu Klasifikasi</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '4px', color: '#fff' }}>
                          {safeLogs[0].time}
                        </div>
                      </div>
                    </motion.div>

                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  Belum ada data analisis AI terbaru dari unit stasiun.
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
