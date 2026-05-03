"use client";
import ApiDocsView from "../components/ApiDocsView";
import Link from "next/link";

export default function PublicApiDocs() {
  return (
    <div className="app-container">
      <main className="main-content" style={{ padding: '60px 80px' }}>
        <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-1px", marginBottom: 8 }}>Dokumentasi API</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>Spesifikasi teknis publik untuk integrasi VisioBin.</p>
          </div>
          <Link href="/" className="btn-secondary" style={{ textDecoration: 'none', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 20px', borderRadius: 8 }}>
            Kembali ke Login
          </Link>
        </div>
        <ApiDocsView />
      </main>
    </div>
  );
}
