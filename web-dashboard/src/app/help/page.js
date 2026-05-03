"use client";
import HelpCenterView from "../components/HelpCenterView";
import Link from "next/link";

export default function PublicHelp() {
  return (
    <div className="app-container">
      <main className="main-content" style={{ padding: '60px 80px' }}>
        <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-1px", marginBottom: 8 }}>Pusat Bantuan</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>FAQ, Privasi, dan Ketentuan Layanan VisioBin.</p>
          </div>
          <Link href="/" className="btn-secondary" style={{ textDecoration: 'none', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 20px', borderRadius: 8 }}>
            Kembali ke Login
          </Link>
        </div>
        <HelpCenterView />
      </main>
    </div>
  );
}
