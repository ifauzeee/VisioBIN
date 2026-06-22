"use client";

import React, { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "./shared/Toast";

export default function ProfileView() {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const isGuest = user?.role === "guest";
  
  const [activeSection, setActiveSection] = useState("general");
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, section) => {
    e.preventDefault();
    setLoading(true);

    const payload = {};
    if (section === "general") {
      payload.full_name = formData.full_name;
      payload.email = formData.email;
    } else if (section === "security") {
      if (!formData.password) {
        addToast("Sandi baru tidak boleh kosong", "error");
        setLoading(false);
        return;
      }
      payload.password = formData.password;
    }

    const result = await updateProfile(payload);
    setLoading(false);

    if (result.success) {
      addToast("Profil berhasil diperbarui", "success");
      if (section === "security") setFormData((prev) => ({ ...prev, password: "" }));
    } else {
      addToast(result.error || "Gagal memperbarui profil", "error");
    }
  };

  if (isGuest) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 40, border: "1px solid var(--border-color)", borderRadius: 8, background: "var(--bg-card)", textAlign: "center" }}>
        <ShieldAlert size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-main)", marginBottom: 8 }}>Akses Terbatas</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Akun tamu tidak diizinkan untuk mengubah profil atau pengaturan keamanan.</p>
      </div>
    );
  }

  const sections = [
    { id: "general", label: "Profil Umum" },
    { id: "security", label: "Keamanan" },
    { id: "danger", label: "Zona Bahaya" }
  ];

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    background: "var(--bg-page)",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    color: "var(--text-main)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--text-main)",
    marginBottom: "6px"
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 60 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text-main)", margin: "0 0 4px 0" }}>Pengaturan</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>Kelola detail akun dan pengaturan keamanan Anda.</p>
      </div>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* Sidebar Navigasi Klasik */}
        <div style={{ flex: "0 0 240px", display: "flex", flexDirection: "column", gap: 4 }}>
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                background: activeSection === sec.id ? "var(--bg-hover)" : "transparent",
                color: activeSection === sec.id ? "var(--text-main)" : "var(--text-muted)",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: activeSection === sec.id ? 600 : 400,
                cursor: "pointer",
                transition: "background 0.2s"
              }}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Konten Kanan */}
        <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 32 }}>
          
          {activeSection === "general" && (
            <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, background: "var(--bg-card)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px 0" }}>Informasi Personal</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Detail identitas yang akan ditampilkan di dalam sistem.</p>
              </div>
              
              <form onSubmit={(e) => handleSubmit(e, "general")}>
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Nama Lengkap</label>
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} style={inputStyle} required />
                  </div>
                  
                  <div>
                    <label style={labelStyle}>Alamat Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} required />
                  </div>
                  
                  <div>
                    <label style={labelStyle}>Peran Pengguna (Role)</label>
                    <input type="text" value={user?.role || ""} disabled style={{ ...inputStyle, background: "var(--bg-body)", color: "var(--text-muted)", cursor: "not-allowed" }} />
                  </div>
                </div>

                <div style={{ padding: "16px 24px", background: "var(--bg-body)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, borderRadius: 6 }}>
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "security" && (
            <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, background: "var(--bg-card)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px 0" }}>Ubah Kata Sandi</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Perbarui kata sandi untuk mengamankan akun Anda.</p>
              </div>
              
              <form onSubmit={(e) => handleSubmit(e, "security")}>
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Kata Sandi Baru</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimal 8 karakter" style={inputStyle} required />
                  </div>
                </div>

                <div style={{ padding: "16px 24px", background: "var(--bg-body)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className="btn-primary" disabled={loading || !formData.password} style={{ padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, borderRadius: 6 }}>
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    Perbarui Sandi
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "danger" && (
            <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, background: "var(--bg-card)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#ef4444", margin: "0 0 4px 0" }}>Hapus Akun</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Menghapus akun Anda dari sistem secara permanen.</p>
              </div>
              
              <div style={{ padding: 24 }}>
                <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 6, padding: 16, marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: "var(--text-main)", margin: 0, lineHeight: 1.5 }}>
                    Peringatan: Seluruh data, konfigurasi, dan riwayat yang terkait dengan akun Anda akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <button style={{ 
                  background: "#ef4444", color: "#fff", border: "none", padding: "8px 16px", 
                  borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" 
                }}>
                  Hapus Akun Saya
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
