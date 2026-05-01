"use client";

import React from "react";
import { Users, ShieldCheck, Mail, UserPlus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import EmptyState from "./shared/EmptyState";

const TEAM_MEMBERS = [
  { name: "Muhammad Ibnu Fauzi", nim: "2307422004", role: "admin", email: "ibnu.fauzi@visiobin.local", avatar: "IF", status: "online" },
  { name: "Dheo Rafi Ibrahimovic", nim: "2307422017", role: "operator", email: "dheo.rafi@visiobin.local", avatar: "DR", status: "online" },
  { name: "Muhammad Adian Hendrawan", nim: "2307422020", role: "operator", email: "adian.h@visiobin.local", avatar: "AH", status: "offline" },
];

const ROLE_CONFIG = {
  admin: { label: "Administrator", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  operator: { label: "Operator", color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
};

export default function TeamView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <>
      {/* KPI */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title"><Users size={16} /> Total Anggota</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12 }}>{TEAM_MEMBERS.length}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>terdaftar di sistem</div>
        </div>
        <div className="card">
          <div className="card-title"><ShieldCheck size={16} color="#f59e0b" /> Admin</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: "#f59e0b" }}>
            {TEAM_MEMBERS.filter(m => m.role === "admin").length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>full access</div>
        </div>
        <div className="card">
          <div className="card-title"><Users size={16} color="#22d3ee" /> Operator</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: "#22d3ee" }}>
            {TEAM_MEMBERS.filter(m => m.role === "operator").length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>monitoring access</div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="card-title" style={{ marginBottom: 16, paddingLeft: 4 }}>👥 Daftar Anggota Tim</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
        {TEAM_MEMBERS.map(member => {
          const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.operator;
          return (
            <div key={member.nim} className="card" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: member.role === "admin"
                  ? "linear-gradient(135deg, #f59e0b, #ef4444)"
                  : "linear-gradient(135deg, var(--brand-inorganic), var(--brand-organic))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0,
                position: "relative",
              }}>
                {member.avatar}
                <div style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 12, height: 12, borderRadius: "50%",
                  background: member.status === "online" ? "#10B981" : "#555",
                  border: "2px solid var(--bg-card)",
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-main)", marginBottom: 2 }}>{member.name}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>{member.nim}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                    color: rc.color, background: rc.bg,
                  }}>{rc.label}</span>
                  <span style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 999,
                    color: member.status === "online" ? "#10B981" : "var(--text-muted)",
                    background: member.status === "online" ? "rgba(16,185,129,0.1)" : "var(--bg-hover)",
                  }}>{member.status === "online" ? "● Online" : "○ Offline"}</span>
                </div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <Mail size={12} /> {member.email}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dosen */}
      <div className="card">
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
      </div>
    </>
  );
}
