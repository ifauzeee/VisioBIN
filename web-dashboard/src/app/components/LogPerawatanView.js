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
import { useTranslations, useLocale } from 'next-intl';

export default function LogPerawatanView() {
  const t = useTranslations('maintenance');
  const locale = useLocale();
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

  const ACTION_TYPES = [
    { value: "cleaning", label: t('types.cleaning'), icon: "🧹" },
    { value: "repair", label: t('types.repair'), icon: "🔧" },
    { value: "sensor_calibration", label: t('types.calibration'), icon: "📡" },
    { value: "battery_replacement", label: t('types.battery'), icon: "🔋" },
    { value: "bin_emptied", label: t('types.emptied'), icon: "🗑️" },
    { value: "inspection", label: t('types.inspection'), icon: "🔍" },
    { value: "other", label: t('types.other'), icon: "📝" },
  ];

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
      toast.error(locale === 'id' ? "Gagal memuat data" : "Failed to load data", e.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, filterBinId, toast, locale]);

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
      toast.warning(locale === 'id' ? "Form Tidak Lengkap" : "Form Incomplete", locale === 'id' ? "Pilih unit bin dan jenis perawatan." : "Select bin unit and action type.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createMaintenanceLog(token, form);
      if (res.success) {
        toast.success(locale === 'id' ? "Berhasil!" : "Success!", locale === 'id' ? "Log perawatan berhasil ditambahkan." : "Maintenance log added successfully.");
        setForm({ bin_id: "", action_type: "", notes: "" });
        setShowForm(false);
        fetchLogs();
      }
    } catch (e) {
      toast.error(locale === 'id' ? "Gagal menyimpan" : "Failed to save", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMaintenanceLog(token, id);
      toast.success(locale === 'id' ? "Dihapus" : "Deleted", locale === 'id' ? "Log perawatan berhasil dihapus." : "Maintenance log deleted.");
      fetchLogs();
    } catch (e) {
      toast.error(locale === 'id' ? "Gagal menghapus" : "Failed to delete", e.message);
    }
  };

  const getActionLabel = (type) => ACTION_TYPES.find(a => a.value === type) || { label: type, icon: "📝" };
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === 'id' ? "id-ID" : "en-US", { day: "numeric", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString(locale === 'id' ? "id-ID" : "en-US", { hour: "2-digit", minute: "2-digit" });
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
            <ClipboardList size={20} /> {t('title')}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {t('subtitle')}
          </p>
        </motion.div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetchLogs} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> {t('reload')}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> {t('addLog')}
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
              <div className="card-title"><Wrench size={16} /> {t('newForm')}</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{t('binUnit')} *</label>
                  <select
                    value={form.bin_id}
                    onChange={(e) => setForm(p => ({ ...p, bin_id: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="">{locale === 'id' ? "Pilih bin..." : "Select bin..."}</option>
                    {bins.map(b => <option key={b.id} value={b.id}>{b.name} — {b.location}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{t('actionType')} *</label>
                  <select
                    value={form.action_type}
                    onChange={(e) => setForm(p => ({ ...p, action_type: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="">{locale === 'id' ? "Pilih jenis..." : "Select type..."}</option>
                    {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{t('notes')}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder={t('notesPlaceholder')}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('cancel')}</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? t('saving') : t('save')}
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
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t('filter')}:</span>
        <select
          value={filterBinId}
          onChange={(e) => { setFilterBinId(e.target.value); setPage(1); }}
          className="form-select"
          style={{ maxWidth: 260, padding: "6px 10px", fontSize: 12 }}
        >
          <option value="">{t('allUnits')}</option>
          {bins.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
          {total} {t('totalLogs')}
        </span>
      </motion.div>

      {/* Log List */}
      {logs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title={t('emptyTitle')}
            description={t('emptyDesc')}
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
                      {t('performedBy')}: <span style={{ fontWeight: 500 }}>{log.performer_name}</span>
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
            ← {t('prev')}
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
            {t('next')} →
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

