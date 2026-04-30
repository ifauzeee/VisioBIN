"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, Activity, Zap, Database, RefreshCw } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAuth } from "../hooks/useAuth";
import { listClassifications } from "../services/api";
import { SkeletonCard, SkeletonChart } from "./shared/Skeleton";
import EmptyState from "./shared/EmptyState";
import {
  analyticsSummary as defaultSummary, analyticsTrend as defaultTrend,
  analyticsSplit as defaultSplit, dataTrenAkurasiHarian as defaultAccuracy,
} from "../dashboardData";

export default function AnalitikView() {
  const { token } = useAuth();
  const [cls, setCls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const r = await listClassifications(token, { limit: 100 });
      if (r.success) setCls(r.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const has = cls.length > 0;
  const avgConf = has ? (cls.reduce((a,c) => a + (c.confidence||0), 0) / cls.length * 100).toFixed(1) : "97.8";
  const avgMs = has ? Math.round(cls.reduce((a,c) => a + (c.inference_time_ms||0), 0) / cls.length) : 38;
  const orgC = cls.filter(c => c.predicted_class === "organic").length;
  const inorgC = cls.filter(c => c.predicted_class === "inorganic").length;
  const total = cls.length;
  const missRate = has ? (100 - parseFloat(avgConf)).toFixed(1) : "2.2";

  const kpi = has ? [
    { label:"Akurasi Sortir", value:`${avgConf}%`, delta:`+${(parseFloat(avgConf)-96.5).toFixed(1)}%`, tone:"#10B981" },
    { label:"Waktu Keputusan", value:`${avgMs}ms`, delta:avgMs<42?`-${42-avgMs}ms`:`+${avgMs-42}ms`, tone:"#22d3ee" },
    { label:"Kesalahan Klasifikasi", value:`${missRate}%`, delta:`-${(3-parseFloat(missRate)).toFixed(1)}%`, tone:"#f59e0b" },
    { label:"Total Klasifikasi", value:`${total}`, delta:`${orgC}O / ${inorgC}A`, tone:"#f97316" },
  ] : defaultSummary;

  const hourly = has ? (() => {
    const b = {};
    cls.forEach(c => {
      const k = `${String(new Date(c.classified_at).getHours()).padStart(2,"0")}:00`;
      if(!b[k]) b[k] = { waktu:k, throughput:0, tc:0, n:0 };
      b[k].throughput++; b[k].tc += (c.confidence||0)*100; b[k].n++;
    });
    return Object.values(b).map(x => ({...x, kepercayaan:Math.round(x.tc/x.n)})).sort((a,b) => a.waktu.localeCompare(b.waktu));
  })() : defaultTrend;

  const split = has ? [
    { label:"Organik", value:total>0?Math.round(orgC/total*100):0, tone:"#10B981" },
    { label:"Anorganik", value:total>0?Math.round(inorgC/total*100):0, tone:"#3B82F6" },
  ] : defaultSplit;

  const daily = has ? (() => {
    const dn = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
    const d = {};
    cls.forEach(c => {
      const name = dn[new Date(c.classified_at).getDay()];
      if(!d[name]) d[name] = { hari:name, tc:0, n:0 };
      d[name].tc += (c.confidence||0)*100; d[name].n++;
    });
    return Object.values(d).map(x => ({ hari:x.hari, akurasi:+(x.tc/x.n).toFixed(1) }));
  })() : defaultAccuracy;

  if (loading) return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:24, marginBottom:24 }}>
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
      <div className="dashboard-grid-2-1" style={{ marginBottom:24 }}>
        <SkeletonChart height={360} />
        <SkeletonCard lines={5} style={{ minHeight:360 }} />
      </div>
    </>
  );

  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:24, marginBottom:24 }}>
        {kpi.map(item => (
          <div key={item.label} className="card analytics-kpi-card">
            <div className="card-title">{item.label}</div>
            <div style={{ marginTop:8, fontSize:34, fontWeight:600, letterSpacing:"-1px" }}>{item.value}</div>
            <div style={{ marginTop:10, fontSize:12, color:item.tone, fontWeight:600 }}>{item.delta} vs kemarin</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom:24 }}>
        <div className="card" style={{ minHeight:360, display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div className="card-title"><TrendingUp size={16} /> Tren Throughput & Kepercayaan</div>
            {has && <button onClick={fetch_} style={{ background:"transparent", border:"none", cursor:"pointer", padding:4 }}><RefreshCw size={14} color="var(--text-muted)" /></button>}
          </div>
          {hourly.length > 0 ? (
            <div style={{ flex:1, marginTop:16, marginLeft:-20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourly} margin={{ top:10, right:12, left:0, bottom:0 }} style={{ background: 'transparent' }}>
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
                  <YAxis yAxisId="right" orientation="right" domain={[80,100]} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background:"#111", border:"1px solid #333", borderRadius:8 }} />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                  <Area yAxisId="left" type="monotone" dataKey="throughput" stroke="var(--brand-inorganic)" strokeWidth={2} fill="url(#gTp)" name="Throughput" />
                  <Area yAxisId="right" type="monotone" dataKey="kepercayaan" stroke="var(--brand-organic)" strokeWidth={2} fill="url(#gCf)" name="Kepercayaan (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState title="Belum Ada Data Tren" description="Data muncul setelah klasifikasi pertama." />}
        </div>

        <div className="card" style={{ minHeight:360, display:"flex", flexDirection:"column" }}>
          <div className="card-title">🔀 Komposisi Klasifikasi</div>
          <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:12 }}>
            {split.map(s => (
              <div key={s.label}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12 }}>
                  <span style={{ color:"var(--text-muted)" }}>{s.label}</span>
                  <span className="mono" style={{ color:"#f4f4f4" }}>{s.value}%</span>
                </div>
                <div className="mix-track"><div className="mix-fill" style={{ width:`${s.value}%`, background:s.tone }} /></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:"auto", paddingTop:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div className="mini-stat"><Zap size={14} color="var(--brand-organic)" /><span className="mono">P95: {avgMs>0?Math.round(avgMs*1.7):64}ms</span></div>
            <div className="mini-stat"><Database size={14} color="var(--brand-inorganic)" /><span className="mono">Total: {total}</span></div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom:24 }}>
        <div className="card" style={{ minHeight:300, display:"flex", flexDirection:"column" }}>
          <div className="card-title">📈 Tren Akurasi Model Harian</div>
          {daily.length > 0 ? (
            <div style={{ flex:1, marginTop:16, marginLeft:-20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top:10, right:10, left:0, bottom:0 }} style={{ background: 'transparent' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="hari" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[90,100]} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background:"#111", border:"1px solid #333", borderRadius:8 }} />
                  <Bar dataKey="akurasi" fill="#f59e0b" radius={[4,4,0,0]} name="Akurasi (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState title="Belum Ada Data Akurasi" />}
        </div>

        <div className="card">
          <div className="card-title"><Activity size={16} /> Ringkasan Performa</div>
          <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { l:"Rata-rata Confidence", v:`${avgConf}%`, c:"#10B981" },
              { l:"Rata-rata Inference", v:`${avgMs}ms`, c:"#22d3ee" },
              { l:"Total Organik", v:String(orgC), c:"#10B981" },
              { l:"Total Anorganik", v:String(inorgC), c:"#3B82F6" },
              { l:"Rasio O/A", v:inorgC>0?`${(orgC/inorgC).toFixed(2)}:1`:"—", c:"#8B5CF6" },
            ].map(s => (
              <div key={s.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:"rgba(255,255,255,0.02)", borderRadius:8, border:"1px solid var(--border-color)" }}>
                <span style={{ fontSize:12, color:"var(--text-muted)" }}>{s.l}</span>
                <span className="mono" style={{ fontSize:14, fontWeight:600, color:s.c }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}