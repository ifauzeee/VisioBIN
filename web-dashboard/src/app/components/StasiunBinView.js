"use client";

import React, { useEffect } from "react";
import {
  Box, MapPin, Thermometer, Weight, Wind, Clock,
  ChevronRight, Activity, TrendingUp
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { useBins } from "../hooks/useBins";
import { useAuth } from "../hooks/useAuth";
import { SkeletonCard, SkeletonChart } from "./shared/Skeleton";
import EmptyState from "./shared/EmptyState";
import { formatHoursRemaining, getBinLevelColor, getBinLevelStatus, formatTime } from "../utils/formatters";

export default function StasiunBinView() {
  const { token } = useAuth();
  const {
    bins, selectedBin, sensorHistory, forecast,
    loading, detailLoading, error, selectBin
  } = useBins(token);

  // Auto-select first bin
  useEffect(() => {
    if (bins.length > 0 && !selectedBin) {
      selectBin(bins[0].id);
    }
  }, [bins, selectedBin, selectBin]);

  if (loading) {
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonChart height={350} />
      </>
    );
  }

  if (error || bins.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={Box}
          title="Belum Ada Stasiun Bin"
          description="Belum ada unit tempat sampah VisioBin yang terdaftar. Tambahkan melalui API atau hubungi administrator."
        />
      </div>
    );
  }

  const historyData = sensorHistory
    .slice()
    .reverse()
    .map((r) => ({
      time: formatTime(r.recorded_at),
      volOrganik: r.volume_organic_pct ?? 0,
      volAnorganik: r.volume_inorganic_pct ?? 0,
      gas: r.gas_amonia_ppm ?? 0,
    }));

  const latestReading = selectedBin?.latest_reading;
  const volOrg = latestReading?.volume_organic_pct ?? 0;
  const volInorg = latestReading?.volume_inorganic_pct ?? 0;
  const avgVol = Math.round((volOrg + volInorg) / 2);

  return (
    <>
      {/* Bin Selector Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {bins.map((bin) => {
          const isActive = selectedBin?.id === bin.id;
          const reading = bin.latest_reading;
          const vO = reading?.volume_organic_pct ?? 0;
          const vI = reading?.volume_inorganic_pct ?? 0;
          const avg = Math.round((vO + vI) / 2);

          return (
            <div
              key={bin.id}
              onClick={() => selectBin(bin.id)}
              className="card bin-selector-card"
              style={{
                cursor: "pointer",
                borderColor: isActive ? "var(--brand-organic)" : undefined,
                background: isActive ? "rgba(16,185,129,0.04)" : undefined,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "var(--brand-organic)",
                  }}
                />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                    {bin.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={10} /> {bin.location || "—"}
                  </div>
                </div>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: bin.status === "active" ? "var(--brand-organic)" : "#f59e0b",
                    boxShadow: `0 0 6px ${bin.status === "active" ? "rgba(16,185,129,0.5)" : "rgba(245,158,11,0.5)"}`,
                  }}
                />
              </div>

              {/* Volume bars */}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Organik</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${vO}%`, background: getBinLevelColor(vO) }} />
                  </div>
                  <div className="mono" style={{ fontSize: 12, marginTop: 4, color: getBinLevelColor(vO) }}>{Math.round(vO)}%</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Anorganik</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${vI}%`, background: getBinLevelColor(vI) }} />
                  </div>
                  <div className="mono" style={{ fontSize: 12, marginTop: 4, color: getBinLevelColor(vI) }}>{Math.round(vI)}%</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Rata-rata: <span className="mono" style={{ color: getBinLevelColor(avg) }}>{avg}%</span>
                </span>
                {isActive && <ChevronRight size={14} color="var(--brand-organic)" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Section */}
      {detailLoading ? (
        <SkeletonChart height={400} />
      ) : selectedBin ? (
        <>
          {/* Stats Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div className="card" style={{ padding: 16 }}>
              <div className="card-title"><Activity size={14} /> Vol. Organik</div>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8, color: getBinLevelColor(volOrg) }}>
                {Math.round(volOrg)}<span style={{ fontSize: 14, color: "var(--text-muted)" }}>%</span>
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div className="card-title"><Activity size={14} /> Vol. Anorganik</div>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8, color: getBinLevelColor(volInorg) }}>
                {Math.round(volInorg)}<span style={{ fontSize: 14, color: "var(--text-muted)" }}>%</span>
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div className="card-title"><Wind size={14} /> Gas Amonia</div>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                {latestReading?.gas_amonia_ppm?.toFixed(1) ?? "—"}
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}> ppm</span>
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div className="card-title"><Weight size={14} /> Berat Total</div>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                {(
                  (latestReading?.weight_organic_kg ?? 0) +
                  (latestReading?.weight_inorganic_kg ?? 0)
                ).toFixed(1)}
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}> kg</span>
              </div>
            </div>
          </div>

          {/* Charts + Forecast */}
          <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
            {/* Sensor History Chart */}
            <div className="card" style={{ minHeight: 380, display: "flex", flexDirection: "column" }}>
              <div className="card-title"><TrendingUp size={16} /> Riwayat Sensor (24 Jam)</div>
              {historyData.length > 0 ? (
                <div style={{ flex: 1, marginTop: 16, marginLeft: -20 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gHistOrg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--brand-organic)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--brand-organic)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gHistInorg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--brand-inorganic)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--brand-inorganic)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="volOrganik" stroke="var(--brand-organic)" strokeWidth={2} fill="url(#gHistOrg)" name="Organik %" />
                      <Area type="monotone" dataKey="volAnorganik" stroke="var(--brand-inorganic)" strokeWidth={2} fill="url(#gHistInorg)" name="Anorganik %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="Belum Ada Riwayat Sensor"
                  description="Data sensor akan muncul saat perangkat mulai mengirim telemetri."
                />
              )}
            </div>

            {/* Forecast Card */}
            <div className="card" style={{ display: "flex", flexDirection: "column" }}>
              <div className="card-title"><Clock size={16} /> Prediksi Pengisian</div>
              {forecast ? (
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Organic */}
                  <div style={{ padding: 16, background: "rgba(16,185,129,0.06)", borderRadius: 10, border: "1px solid rgba(16,185,129,0.15)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Organik Penuh Dalam</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: "var(--brand-organic)" }}>
                      {formatHoursRemaining(forecast.hours_until_full_organic)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      Laju: {forecast.fill_rate_organic_per_hr?.toFixed(2) ?? "—"}%/jam
                    </div>
                    <div className="progress-bar" style={{ marginTop: 8 }}>
                      <div className="progress-fill" style={{ width: `${forecast.current_volume_organic_pct}%`, background: "var(--brand-organic)" }} />
                    </div>
                  </div>

                  {/* Inorganic */}
                  <div style={{ padding: 16, background: "rgba(59,130,246,0.06)", borderRadius: 10, border: "1px solid rgba(59,130,246,0.15)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Anorganik Penuh Dalam</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: "var(--brand-inorganic)" }}>
                      {formatHoursRemaining(forecast.hours_until_full_inorganic)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      Laju: {forecast.fill_rate_inorganic_per_hr?.toFixed(2) ?? "—"}%/jam
                    </div>
                    <div className="progress-bar" style={{ marginTop: 8 }}>
                      <div className="progress-fill" style={{ width: `${forecast.current_volume_inorganic_pct}%`, background: "var(--brand-inorganic)" }} />
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Status</div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>
                      {getBinLevelStatus(avgVol)}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Prediksi Tidak Tersedia"
                  description="Diperlukan data sensor minimal 2 titik untuk menghitung prediksi."
                />
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
