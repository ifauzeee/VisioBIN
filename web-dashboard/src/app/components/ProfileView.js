"use client";

import React, { useState } from "react";
import { User, Mail, Lock, Camera, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { useToast } from "./shared/Toast";

export default function ProfileView() {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      full_name: formData.full_name,
      email: formData.email,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    const result = await updateProfile(payload);
    setLoading(false);

    if (result.success) {
      addToast("Profil berhasil diperbarui!", "success");
      setFormData((prev) => ({ ...prev, password: "" }));
    } else {
      addToast(result.error || "Gagal memperbarui profil", "error");
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } }
      }}
      className="profile-container" 
      style={{ maxWidth: 800, margin: "0 auto" }}
    >
      <motion.div 
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className="card" 
        style={{ padding: 0, overflow: "hidden" }}
      >
        {/* Header Background */}
        <div 
          style={{ 
            height: 120, 
            background: "linear-gradient(135deg, var(--brand-inorganic), var(--brand-organic))",
            opacity: 0.8
          }} 
        />
        
        <div style={{ padding: "0 40px 40px", marginTop: -60 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 40 }}>
            <motion.div 
              style={{ position: "relative" }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div 
                style={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: "50%", 
                  background: "var(--bg-card)",
                  border: "4px solid var(--bg-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "var(--shadow-card)",
                  fontSize: 48,
                  fontWeight: 700,
                  color: "var(--text-main)"
                }}
              >
                {formData.full_name?.charAt(0).toUpperCase() || <User size={48} />}
              </div>
              <button 
                style={{ 
                  position: "absolute", 
                  bottom: 5, 
                  right: 5, 
                  background: "var(--brand-organic)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
                }}
              >
                <Camera size={16} />
              </button>
            </motion.div>
            
            <motion.div 
              style={{ paddingBottom: 10 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{formData.full_name || "User Name"}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
                <CheckCircle2 size={14} color="var(--brand-organic)" />
                <span>ID: {user?.id}</span>
                <span style={{ margin: "0 8px" }}>•</span>
                <span style={{ textTransform: "capitalize" }}>{user?.role || "User"}</span>
              </div>
            </motion.div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }} className="form-group">
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>
                  Nama Lengkap
                </label>
                <div style={{ position: "relative" }}>
                  <User size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      background: "var(--bg-page)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 8,
                      color: "var(--text-main)",
                      outline: "none"
                    }}
                  />
                </div>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, x: 10 }, visible: { opacity: 1, x: 0 } }} className="form-group">
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      background: "var(--bg-page)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 8,
                      color: "var(--text-main)",
                      outline: "none"
                    }}
                  />
                </div>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="form-group" style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>
                  Ganti Kata Sandi (Kosongkan jika tidak ingin mengubah)
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="password"
                    name="password"
                    placeholder="Kata sandi baru"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      background: "var(--bg-page)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 8,
                      color: "var(--text-main)",
                      outline: "none"
                    }}
                  />
                </div>
              </motion.div>
            </div>

            <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 24px",
                  background: "var(--brand-organic)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.2)"
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>

      <motion.div 
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className="card" 
        style={{ marginTop: 24, border: "1px solid rgba(239, 68, 68, 0.2)" }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#ef4444", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={20} />
          Zona Bahaya
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
          Menghapus akun akan menghapus semua data Anda secara permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <button 
          style={{ 
            padding: "10px 16px", 
            background: "transparent", 
            border: "1px solid #ef4444", 
            color: "#ef4444",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer"
          }}
        >
          Hapus Akun Saya
        </button>
      </motion.div>
    </motion.div>
  );
}
