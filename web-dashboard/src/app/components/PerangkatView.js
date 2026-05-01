"use client";

import React from "react";
import { Cpu, Wifi, AlertTriangle, MapPin, Activity } from "lucide-react";
import { useBins } from "../hooks/useBins";
import { useAuth } from "../hooks/useAuth";
import { SkeletonCard, SkeletonTable } from "./shared/Skeleton";
import EmptyState from "./shared/EmptyState";
import { getBinLevelColor } from "../utils/formatters";
import { dataSensor } from "../dashboardData";

export default function PerangkatView() {
  const { token } = useAuth();
  const { bins, loading, error } = useBins(token);

  // Merge real bins data with simulated sensor data for enriched view
  const hasBins = bins.length > 0;
  const aktif = hasBins
    ? bins.filter((b) => b.status === "active").length
    : dataSensor.filter((s) => s.status === "aktif").length;
  const peringatan = hasBins
    ? bins.filter((b) => b.status !== "active").length
    : dataSensor.filter((s) => s.status === "peringatan").length;
  const totalDevices = hasBins ? bins.length : dataSensor.length;

  // Build sensor data from real bins or fallback
  const sensorData = hasBins
    ? bins.map((bin) => {
        const r = bin.latest_reading;
        return {
          id: bin.id.slice(0, 8).toUpperCase(),
          name: bin.name,
          lokasi: bin.location || "—",
          status: bin.status === "active" ? "aktif" : "peringatan",
          volOrganik: r?.volume_organic_pct ?? 0,
          volAnorganik: r?.volume_inorganic_pct ?? 0,
          gas: r?.gas_amonia_ppm ?? 0,
          weightOrg: r?.weight_organic_kg ?? 0,
          weightInorg: r?.weight_inorganic_kg ?? 0,
          updatedAt: r?.recorded_at,
        };
      })
    : dataSensor.map((s) => ({
        id: s.id,
        name: s.tipe,
        lokasi: s.lokasi,
        status: s.status,
        volOrganik: 0,
        volAnorganik: 0,
        gas: 0,
        weightOrg: 0,
        weightInorg: 0,
        baterai: s.baterai,
        suhu: s.suhu,
      }));

  return (
    <>
      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {loading ? (
          [1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="card">
              <div className="card-title">
                <Cpu size={16} /> Total Perangkat
              </div>
              <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12 }}>
                {totalDevices}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                unit terdaftar di sistem
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                <Wifi size={16} color="var(--brand-organic)" /> Aktif
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 600,
                  marginTop: 12,
                  color: "var(--brand-organic)",
                }}
              >
                {aktif}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                beroperasi normal
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                <AlertTriangle size={16} color="#f59e0b" /> Peringatan
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 600,
                  marginTop: 12,
                  color: "#f59e0b",
                }}
              >
                {peringatan}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                butuh perhatian
              </div>
            </div>
          </>
        )}
      </div>

      {/* Device Table */}
      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : sensorData.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Cpu}
            title="Belum Ada Perangkat"
            description="Perangkat IoT akan muncul setelah terdaftar dan mengirim data."
          />
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">📡 Status Perangkat IoT</div>
          <div style={{ marginTop: 16, overflowX: "auto" }}>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Perangkat</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                  <th>Vol. Organik</th>
                  <th>Vol. Anorganik</th>
                  <th>Gas (ppm)</th>
                </tr>
              </thead>
              <tbody>
                {sensorData.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {s.id}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={11} /> {s.lokasi}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className={`status-dot ${s.status}`} />
                        <span
                          style={{
                            textTransform: "capitalize",
                            color: s.status === "aktif" ? "var(--brand-organic)" : "#f59e0b",
                            fontSize: 12,
                          }}
                        >
                          {s.status}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${s.volOrganik}%`,
                              background: getBinLevelColor(s.volOrganik),
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {Math.round(s.volOrganik)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${s.volAnorganik}%`,
                              background: getBinLevelColor(s.volAnorganik),
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {Math.round(s.volAnorganik)}%
                        </span>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 13 }}>
                      {s.gas?.toFixed(1) ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Device Cards */}
      <div className="card-title" style={{ marginBottom: 16, paddingLeft: 4 }}>
        🔧 Detail Perangkat
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {sensorData.map((s) => {
          const totalWeight = (s.weightOrg || 0) + (s.weightInorg || 0);
          return (
            <div key={s.id} className="sensor-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className={`status-dot ${s.status}`} />
                  <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
                    {s.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: s.status === "aktif" ? "var(--brand-organic)" : "#f59e0b",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {s.status}
                </span>
              </div>

              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                📍 {s.lokasi}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div
                    style={{
                      background: "var(--bg-hover)",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>🟢 Organik</div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: getBinLevelColor(s.volOrganik),
                    }}
                  >
                    {Math.round(s.volOrganik)}%
                  </div>
                </div>
                  <div
                    style={{
                      background: "var(--bg-hover)",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>🔵 Anorganik</div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: getBinLevelColor(s.volAnorganik),
                    }}
                  >
                    {Math.round(s.volAnorganik)}%
                  </div>
                </div>
                  <div
                    style={{
                      background: "var(--bg-hover)",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>⚖️ Berat</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>
                    {totalWeight.toFixed(1)} kg
                  </div>
                </div>
                  <div
                    style={{
                      background: "var(--bg-hover)",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>💨 Gas</div>
                  <div className="mono" style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: (s.gas || 0) > 50 ? "#ef4444" : (s.gas || 0) > 20 ? "#f59e0b" : "var(--text-main)"
                  }}>
                    {s.gas?.toFixed(1) ?? "—"}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
                Update:{" "}
                {s.updatedAt
                  ? new Date(s.updatedAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "—"}{" "}
                WIB
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}