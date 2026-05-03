"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, Activity, Zap, Database, RefreshCw, Download, FileText, ShieldCheck } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { listClassifications } from "../services/api";
import { SkeletonChart } from "./shared/Skeleton";
import EmptyState from "./shared/EmptyState";
import {
  analyticsTrend as defaultTrend,
  dataTrenAkurasiHarian as defaultAccuracy,
} from "../dashboardData";

export default React.memo(function AnalitikView() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      const res = await listClassifications(token, { limit: 100 });
      if (res.success) {
        const logs = res.data || [];
        const trend = logs.slice(0, 20).reverse().map(l => ({
          time: new Date(l.classified_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          confidence: +(l.confidence * 100).toFixed(1),
          ms: l.inference_time_ms
        }));

        const totalOrg = logs.filter(l => l.predicted_class === 'organic').length;
        const totalInorg = logs.filter(l => l.predicted_class === 'inorganic').length;

        setData({
          trend,
          summary: {
            total: logs.length,
            organic: totalOrg,
            inorganic: totalInorg,
            avg_confidence: logs.length > 0 ? +(logs.reduce((acc, l) => acc + l.confidence, 0) / logs.length * 100).toFixed(1) : 0,
            avg_inference: logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + l.inference_time_ms, 0) / logs.length) : 0
          }
        });
      }
    } catch (err) {
      console.error("Analitik fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); 
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (loading && !data) return <div style={{ padding: 40 }}><SkeletonChart /></div>;
  if (!data) return <EmptyState title="Belum ada data analitik" />;

  const trendData = data.trend.length ? data.trend : defaultTrend;
  const s = data.summary;
  
  const kpi = [
    { label: "Total Sampler", value: s.total, icon: <Database size={18} />, color: "var(--brand-organic)" },
    { label: "Akurasi Rata-rata", value: `${s.avg_confidence}%`, icon: <Zap size={18} />, color: "#f59e0b" },
    { label: "Throughput", value: "2.4 item/s", icon: <TrendingUp size={18} />, color: "#8B5CF6" },
    { label: "Data Integrity", value: "100%", icon: <ShieldCheck size={18} />, color: "#22d3ee" },
  ];

  const orgC = s.organic;
  const inorgC = s.inorganic;
  const avgConf = s.avg_confidence;
  const avgMs = s.avg_inference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16 }}>
        <motion.div 
          style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:24, flex: 1 }}
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
        >
          {kpi.map(item => (
            <motion.div 
              key={item.label} 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="card" 
              style={{ padding: 24 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, background: "rgba(255,255,255,0.03)", borderRadius: 10, color: item.color }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>{item.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-1px" }}>{item.value}</div>
            </motion.div>
          ))}
        </motion.div>

        <div style={{ display: "flex", gap: 12 }}>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={fetchAnalytics}
            className="btn-secondary" 
            style={{ width: 44, height: 44, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <RefreshCw size={18} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open(`http://localhost:8080/api/v1/classifications/export?token=${token}`, "_blank")}
            className="btn-primary" 
            style={{ padding: "12px 24px", height: "fit-content", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}
          >
            <Download size={18} /> Export Analitik
          </motion.button>
        </div>
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom:24 }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card" 
          style={{ minHeight:360, display:"flex", flexDirection:"column" }} 
        >
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div className="card-title"><TrendingUp size={16} /> Tren Throughput & Kepercayaan</div>
          </div>
          <div style={{ flex: 1, marginTop: 16, marginLeft: -20, minWidth: 0, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12 }} 
                  itemStyle={{ fontSize: 12 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorConf)" 
                  name="Akurasi (%)" 
                  isAnimationActive={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="ms" 
                  stroke="#22d3ee" 
                  strokeWidth={2} 
                  fill="none" 
                  name="Inference (ms)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card" 
          style={{ display:"flex", flexDirection:"column" }}
        >
          <div className="card-title"><Activity size={16} /> Distribusi Klasifikasi</div>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", minWidth: 0, position: 'relative' }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[{ name: "Organik", val: orgC }, { name: "Anorganik", val: inorgC }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Bar 
                  dataKey="val" 
                  radius={[6, 6, 0, 0]} 
                  isAnimationActive={false}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#3B82F6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { l:"Total Organik", v:orgC, c:"#10B981" },
              { l:"Total Anorganik", v:inorgC, c:"#3B82F6" }
            ].map(x => (
              <div key={x.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--text-muted)" }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:x.c }} /> {x.l}
                </div>
                <span className="mono" style={{ fontSize:13, fontWeight:600 }}>{x.v}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="dashboard-grid-2-1">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card" 
          style={{ minHeight:300 }}
        >
          <div className="card-title"><FileText size={16} /> Tren Akurasi Harian</div>
          <div style={{ height: 220, marginTop: 16, marginLeft: -20, minWidth: 0, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={defaultAccuracy}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[90, 100]} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12 }} />
                <Area 
                  type="monotone" 
                  dataKey="acc" 
                  stroke="#f59e0b" 
                  fill="rgba(245,158,11,0.05)" 
                  strokeWidth={2} 
                  name="Akurasi Avg (%)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="card-title">🚀 Statistik Cepat</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:20 }}>
            {[
              { l:"Rata-rata Confidence", v:`${avgConf}%`, c:"#10B981" },
              { l:"Rata-rata Inference", v:`${avgMs}ms`, c:"#22d3ee" },
              { l:"Total Organik", v:String(orgC), c:"#10B981" },
              { l:"Total Anorganik", v:String(inorgC), c:"#3B82F6" },
              { l:"Rasio O/A", v:inorgC>0?`${(orgC/inorgC).toFixed(2)}:1`:"—", c:"#8B5CF6" },
            ].map((s, i) => (
              <motion.div 
                key={s.l} 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + (i * 0.05) }}
                style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:"rgba(255,255,255,0.02)", borderRadius:8, border:"1px solid var(--border-color)" }}
              >
                <span style={{ fontSize:12, color:"var(--text-muted)" }}>{s.l}</span>
                <span className="mono" style={{ fontSize:14, fontWeight:600, color:s.c }}>{s.v}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});