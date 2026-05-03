"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wrench, Plus, Trash2, Calendar, ChevronDown, RefreshCw, ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { listMaintenanceLogs, createMaintenanceLog, deleteMaintenanceLog, listBins } from "../services/api";
import { SkeletonCard } from "./shared/Skeleton";
import EmptyState from "./shared/EmptyState";
import { useToast } from "./shared/Toast";

const ACTION_TYPES = [
  { value: "cleaning", label: "Pembersihan", icon: "🧹" },
  { value: "repair", label: "Perbaikan Fisik", icon: "🔧" },
  { value: "sensor_calibration", label: "Kalibrasi Sensor", icon: "📡" },
  { value: "battery_replacement", label: "Ganti Baterai", icon: "🔋" },
  { value: "bin_emptied", label: "Pengambilan Sampah", icon: "🗑️" },
  { value: "inspection", label: "Inspeksi Rutin", icon: "🔍" },
  { value: "other", label: "Lainnya", icon: "📝" },
];

export default function LogPerawatanView() {
  const { token } = useAuth();
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterBinId, setFilterBinId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ bin_id: "", action_type: "", notes: "" });

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterBinId) params.bin_id = filterBinId;
      const res = await listMaintenanceLogs(token, params);
      if (res.success) {
        setLogs(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data", e.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, filterBinId, toast]);

  const fetchBins = useCallback(async () => {
    if (!token) return;
    try {
      const res = await listBins(token);
      if (res.success) setBins(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchBins(); }, [fetchBins]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.bin_id || !form.action_type) {
      toast.warning("Form Tidak Lengkap", "Pilih unit bin dan jenis perawatan.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createMaintenanceLog(token, form);
      if (res.success) {
        toast.success("Berhasil!", "Log perawatan berhasil ditambahkan.");
        setForm({ bin_id: "", action_type: "", notes: "" });
        setShowForm(false);
        fetchLogs();
      }
    } catch (e) {
      toast.error("Gagal menyimpan", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMaintenanceLog(token, id);
      toast.success("Dihapus", "Log perawatan berhasil dihapus.");
      fetchLogs();
    } catch (e) {
      toast.error("Gagal menghapus", e.message);
    }
  };

  const getActionLabel = (type) => ACTION_TYPES.find(a => a.value === type) || { label: type, icon: "📝" };
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const totalPages = Math.ceil(total / 15);

  if (loading && logs.length === 0) {
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={3} />)}
        </div>
      </>
    );
  }

  return (
    <motion.div
      key={total}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
            <ClipboardList size={20} /> Log Perawatan
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Riwayat perawatan dan inspeksi unit VisioBin
          </p>
        </motion.div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetchLogs} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Muat Ulang
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Tambah Log
          </button>
        </div>
      </div>

      {/* Form Tambah */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden", marginBottom: 24 }}
          >
            <form onSubmit={handleCreate} className="card" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24 }}>
              <div className="card-title"><Wrench size={16} /> Form Perawatan Baru</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Unit Bin *</label>
                  <select
                    value={form.bin_id}
                    onChange={(e) => setForm(p => ({ ...p, bin_id: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="">Pilih bin...</option>
                    {bins.map(b => <option key={b.id} value={b.id}>{b.name} — {b.location}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Jenis Perawatan *</label>
                  <select
                    value={form.action_type}
                    onChange={(e) => setForm(p => ({ ...p, action_type: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="">Pilih jenis...</option>
                    {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Detail perawatan, observasi, atau catatan teknis..."
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Batal</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Menyimpan..." : "Simpan Log"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card" 
        style={{ padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}
      >
        <ChevronDown size={14} color="var(--text-muted)" />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Filter:</span>
        <select
          value={filterBinId}
          onChange={(e) => { setFilterBinId(e.target.value); setPage(1); }}
          className="form-select"
          style={{ maxWidth: 260, padding: "6px 10px", fontSize: 12 }}
        >
          <option value="">Semua Unit</option>
          {bins.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
          {total} total log
        </span>
      </motion.div>

      {/* Log List */}
      {logs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="Belum Ada Log Perawatan"
            description='Klik "Tambah Log" untuk mencatat perawatan pertama.'
          />
        </div>
      ) : (
        <motion.div 
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } }
          }}
        >
          {logs.map((log) => {
            const action = getActionLabel(log.action_type);
            return (
              <motion.div
                key={log.id}
                variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                className="card"
                style={{ padding: 16, display: "flex", gap: 14, alignItems: "flex-start" }}
                whileHover={{ scale: 1.005, background: "var(--bg-hover)" }}
                layout
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(16,185,129,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>
                  {action.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>
                        {action.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{log.bin_name || log.bin_id}</span>
                        <span>•</span>
                        <Calendar size={10} />
                        <span>{formatDate(log.performed_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(log.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)", opacity: 0.5 }}
                      title="Hapus log"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {log.notes && (
                    <div style={{
                      marginTop: 10, padding: "8px 12px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 6, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5,
                    }}>
                      {log.notes}
                    </div>
                  )}

                  {log.performer_name && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
                      Oleh: <span style={{ fontWeight: 500 }}>{log.performer_name}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}
        >
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: 12 }}
          >
            ← Sebelumnya
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--text-muted)", padding: "0 12px" }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: 12 }}
          >
            Selanjutnya →
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
