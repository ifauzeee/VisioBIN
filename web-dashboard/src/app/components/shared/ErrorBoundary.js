"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            background: "var(--bg-card)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "16px",
            textAlign: "center",
            margin: "24px 0",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <AlertTriangle size={24} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px", color: "var(--text-main)" }}>
            Terjadi Kesalahan Sistem
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "360px", marginBottom: "20px", lineHeight: "1.5" }}>
            {this.state.error?.message || "Gagal memproses tampilan komponen ini. Hubungi operator jika error terus berlanjut."}
          </p>
          <button
            onClick={this.handleReset}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              fontSize: "13px",
            }}
          >
            <RefreshCw size={14} />
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
