"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, ShieldCheck, Mail, RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { listUsers } from "../services/api";
import { SkeletonCard } from "./shared/Skeleton";
import EmptyState from "./shared/EmptyState";

import { motion } from "framer-motion";

const ROLE_CONFIG = {
  admin: { label: "Administrator", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  operator: { label: "Operator", color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
};

export default function TeamView() {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <button onClick={fetchMembers} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Muat Ulang
        </button>
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
          <div className="card-title"><ShieldCheck size={16} color="#f59e0b" /> Admin</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: "#f59e0b" }}>
            {members.filter(m => m.role === "admin").length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>full access</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card" whileHover={{ y: -5 }}>
          <div className="card-title"><Users size={16} color="#22d3ee" /> Operator</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: "#22d3ee" }}>
            {members.filter(m => m.role === "operator").length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>monitoring access</div>
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
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                    <Mail size={12} /> {member.email}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

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
