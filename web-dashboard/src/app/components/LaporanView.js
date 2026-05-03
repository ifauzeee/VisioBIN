"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush
} from "recharts";
import { Download, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { listClassifications } from "../services/api";
import { SkeletonChart, SkeletonTable } from "./shared/Skeleton";
import EmptyState from "./shared/EmptyState";
import { formatDate } from "../utils/formatters";
import {
  dataLaporanHarian as defDaily, dataRingkasanMingguan as defWeekly,
  dataLingkunganBulanan as defEnv,
} from "../dashboardData";

export default React.memo(function LaporanView() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [brushRange, setBrushRange] = useState({ start: 0, end: undefined });

  const handleBrushChange = useCallback((range) => {
    setBrushRange({ start: range.startIndex, end: range.endIndex });
  }, []);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    try {
      const res = await listClassifications(token, { limit: 100 });
      if (res.success) {
        const logs = res.data || [];
        // Group by day for simple report
        const daily = logs.slice(0, 15).map(l => ({
          tgl: formatDate(l.classified_at),
          organik: l.predicted_class === 'organic' ? 1 : 0,
          anorganik: l.predicted_class === 'inorganic' ? 1 : 0,
        }));
        setData({ daily, logs });
      }
    } catch (err) {
      console.error("Laporan fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading && !data) return <div style={{ padding: 40 }}><SkeletonChart /></div>;
  if (!data) return <EmptyState title="Belum ada data laporan" />;

  const dailyData = data.daily.length ? data.daily : defDaily;
  const logs = data.logs;
  const totalItems = logs.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* KPI */}
      <motion.div 
        className="kpi-grid" 
        style={{ marginBottom: 24 }}
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="card">
          <div className="card-title">Total Klasifikasi</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 12 }}>{totalItems}</div>
          <div style={{ fontSize: 11, color: "var(--brand-organic)", marginTop: 4 }}>+12% dari kemarin</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="card">
          <div className="card-title">Rata-rata Akurasi</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 12 }}>97.4%</div>
          <div style={{ fontSize: 11, color: "var(--brand-organic)", marginTop: 4 }}>Sangat Stabil</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="card">
          <div className="card-title">Estimasi Volume</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 12 }}>12.4 Kg</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Kumulatif</div>
        </motion.div>
      </motion.div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <motion.div 
          className="card" 
          style={{ minHeight: 400, display: "flex", flexDirection: "column" }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div className="card-title" style={{ margin: 0 }}>📊 Tren Klasifikasi Harian</div>
            <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>Download CSV</button>
          </div>
          <div style={{ flex: 1, marginLeft: -20, minWidth: 0, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="tgl" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="organik" fill="var(--brand-organic)" radius={[4, 4, 0, 0]} name="Organik" isAnimationActive={false} />
                <Bar dataKey="anorganik" fill="var(--brand-inorganic)" radius={[4, 4, 0, 0]} name="Anorganik" isAnimationActive={false} />
                <Brush 
                  dataKey="tgl" 
                  height={30} 
                  stroke="var(--border-color)" 
                  fill="var(--bg-card)" 
                  tickFormatter={() => ''} 
                  startIndex={brushRange.start}
                  endIndex={brushRange.end}
                  onChange={handleBrushChange}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card">
            <div className="card-title">🌍 Dampak Lingkungan</div>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>CO2 Terhindar</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>42.1 Kg</span>
              </div>
              <div style={{ height: 6, background: "rgba(16,185,129,0.1)", borderRadius: 3 }}>
                <div style={{ width: "75%", height: "100%", background: "var(--brand-organic)", borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Lahan Terselamatkan</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>2.4 m²</span>
              </div>
              <div style={{ height: 6, background: "rgba(34,211,238,0.1)", borderRadius: 3 }}>
                <div style={{ width: "45%", height: "100%", background: "#22d3ee", borderRadius: 3 }} />
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="card-title">📑 Ringkasan Cepat</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>ORGANIK TERBANYAK</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Sisa Makanan</div>
              </div>
              <div style={{ padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>ANORGANIK TERBANYAK</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Botol Plastik PET</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="card-title" style={{ margin: 0 }}>📋 Log Laporan Mendalam</div>
          <button 
            className="btn-primary" 
            style={{ padding: "8px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}
            onClick={() => window.print()}
          >
            <Download size={14} /> Cetak Laporan
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", background: "rgba(255,255,255,0.01)" }}>
                <th style={{ padding: "16px 24px", fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Waktu</th>
                <th style={{ padding: "16px 24px", fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Item</th>
                <th style={{ padding: "16px 24px", fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Kategori</th>
                <th style={{ padding: "16px 24px", fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Kepercayaan</th>
                <th style={{ padding: "16px 24px", fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Stasiun</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 10).map((log, i) => (
                <tr key={log.id} style={{ borderTop: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "16px 24px", fontSize: 13 }}>{formatDate(log.classified_at)}</td>
                  <td style={{ padding: "16px 24px", fontSize: 13, fontWeight: 500 }}>{log.predicted_class}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ 
                      fontSize: 10, 
                      padding: "4px 8px", 
                      borderRadius: 4, 
                      background: log.predicted_class === 'organic' ? "rgba(16,185,129,0.1)" : "rgba(59,130,246,0.1)",
                      color: log.predicted_class === 'organic' ? "var(--brand-organic)" : "var(--brand-inorganic)",
                      textTransform: "uppercase",
                      fontWeight: 700
                    }}>
                      {log.predicted_class}
                    </span>
                  </td>
                  <td className="mono" style={{ padding: "16px 24px", fontSize: 13 }}>{(log.confidence * 100).toFixed(1)}%</td>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "var(--text-muted)" }}>Bin-{log.bin_id || '01'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
});