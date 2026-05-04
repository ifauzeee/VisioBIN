"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, ShieldCheck, Mail, RefreshCw, BarChart, Cpu, Plus, X, UserPlus, Shield, Save, Trash2 } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { listUsers, registerUser, deleteUser } from "../services/api";
import { SkeletonCard } from "./shared/Skeleton";
import EmptyState from "./shared/EmptyState";

import { motion, AnimatePresence } from "framer-motion";

const ROLE_CONFIG = {
  admin: { label: "Administrator", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  operator: { label: "Operator (OB)", color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  manager: { label: "Manager", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  technician: { label: "Teknisi", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
};

export default function TeamView() {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role: "operator"
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchMembers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await listUsers(token);
      if (res.success) {
        setMembers(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await registerUser(formData);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({ username: "", email: "", password: "", full_name: "", role: "operator" });
        fetchMembers();
      }
    } catch (err) {
      setError(err.message || "Gagal membuat akun.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Hapus anggota ini?")) return;
    try {
      const res = await deleteUser(token, id);
      if (res.success) fetchMembers();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  if (loading && members.length === 0) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        {[1, 2, 3].map(i => <SkeletonCard key={i} lines={3} />)}
      </div>
    );
  }

  return (
    <motion.div
      key={members.length}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={20} /> Manajemen Tim
        </h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={fetchMembers} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Muat Ulang
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Tambah Anggota
          </button>
        </div>
      </div>

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
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card" whileHover={{ y: -5 }}>
          <div className="card-title"><Users size={16} /> Total Anggota</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12 }}>{members.length}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>terdaftar di sistem</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card" whileHover={{ y: -5 }}>
          <div className="card-title"><ShieldCheck size={16} color="#f59e0b" /> Administrator</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: "#f59e0b" }}>
            {members.filter(m => m.role === "admin").length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>pengelola sistem</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card" whileHover={{ y: -5 }}>
          <div className="card-title"><Users size={16} color="#22d3ee" /> Petugas OB</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: "#22d3ee" }}>
            {members.filter(m => m.role === "operator").length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>operasional lapangan</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card" whileHover={{ y: -5 }}>
          <div className="card-title"><BarChart size={16} color="#8b5cf6" /> Manajer</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: "#8b5cf6" }}>
            {members.filter(m => m.role === "manager").length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>laporan & statistik</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card" whileHover={{ y: -5 }}>
          <div className="card-title"><Cpu size={16} color="#10b981" /> Teknisi</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: "#10b981" }}>
            {members.filter(m => m.role === "technician").length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>pemeliharaan IoT</div>
        </motion.div>
      </motion.div>

      {/* Members Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="card-title" 
        style={{ marginBottom: 16, paddingLeft: 4 }}
      >
        👥 Daftar Anggota Aktif
      </motion.div>
      {members.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="Tidak Ada Anggota" description="Belum ada anggota tim lain yang terdaftar." />
        </div>
      ) : (
        <motion.div 
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05, delayChildren: 0.4 } }
          }}
        >
          {members.map(member => {
            const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.operator;
            const initials = (member.full_name || member.username || "?").substring(0, 2).toUpperCase();
            return (
              <motion.div 
                key={member.id} 
                variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                className="card" 
                style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: member.role === "admin"
                    ? "linear-gradient(135deg, #f59e0b, #ef4444)"
                    : "linear-gradient(135deg, var(--brand-inorganic), var(--brand-organic))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0,
                  position: "relative",
                }}>
                  {initials}
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 12, height: 12, borderRadius: "50%",
                    background: "#10B981", // Simplified online status for now
                    border: "2px solid var(--bg-card)",
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-main)", marginBottom: 2 }}>{member.full_name}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>@{member.username}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                      color: rc.color, background: rc.bg,
                    }}>{rc.label}</span>
                    <span style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 999,
                      color: "#10B981",
                      background: "rgba(16,185,129,0.1)",
                    }}>● Aktif</span>
                  </div>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                      <Mail size={12} /> {member.email}
                    </div>
                    <button 
                      onClick={() => handleDeleteUser(member.id)}
                      style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}
                      title="Hapus Anggota"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Registration Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card"
              style={{ width: "100%", maxWidth: 500, padding: 0, overflow: "hidden" }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
                  <UserPlus size={20} color="var(--brand-organic)" /> Tambah Anggota Tim
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} style={{ padding: 24 }}>
                {error && (
                  <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#ef4444", fontSize: 13, marginBottom: 20 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "grid", gap: 16 }}>
                  <div className="form-group">
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>Nama Lengkap</label>
                    <input 
                      type="text" 
                      className="input-field"
                      placeholder="Masukkan nama lengkap..."
                      required
                      value={formData.full_name}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="form-group">
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>Username</label>
                      <input 
                        type="text" 
                        className="input-field"
                        placeholder="username"
                        required
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>Email</label>
                      <input 
                        type="email" 
                        className="input-field"
                        placeholder="email@example.com"
                        required
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>Kata Sandi</label>
                    <input 
                      type="password" 
                      className="input-field"
                      placeholder="Minimal 6 karakter"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>Role (Hak Akses)</label>
                    <div style={{ position: "relative" }}>
                      <Shield size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <select 
                        className="input-field"
                        style={{ paddingLeft: 40 }}
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                      >
                        <option value="operator">Operator (OB)</option>
                        <option value="admin">Administrator</option>
                        <option value="manager">Manager</option>
                        <option value="technician">Teknisi</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                    Batal
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {submitting ? "Memproses..." : <><Save size={16} /> Simpan Anggota</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Dosen */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="card-title">🎓 Dosen Pembimbing</div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0,
          }}>PO</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-main)" }}>Dr. Prihatin Oktivasari, S.Si., M.Si</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Program Studi Teknik Multimedia Dan Jaringan — Politeknik Negeri Jakarta
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
