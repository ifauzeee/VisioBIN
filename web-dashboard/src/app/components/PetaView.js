"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { MapPin, Info, Battery, Zap, Trash2 } from "lucide-react";
import { getBinLevelColor } from "../utils/formatters";

// Fix for Leaflet default icon issues in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker for VisioBin Status
const createCustomIcon = (level) => {
  const color = getBinLevelColor(level);
  return L.divIcon({
    className: "custom-bin-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: var(--bg-card);
        border: 2px solid ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: pulse-${level > 80 ? 'red' : 'green'} 2s infinite;
      ">
        <div style="width: 12px; height: 12px; background: ${color}; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function PetaView({ bins }) {
  const [activeBin, setActiveBin] = useState(null);

  // Sample center (Jakarta/Depok area)
  const defaultCenter = [-6.3625, 106.8241]; // Near PNJ/UI Depok
  const mapCenter = activeBin 
    ? [activeBin.latitude || defaultCenter[0], activeBin.longitude || defaultCenter[1]]
    : defaultCenter;

  // Enhance bins with sample locations if they don't have them
  const enrichedBins = bins.map((bin, i) => ({
    ...bin,
    latitude: bin.latitude || defaultCenter[0] + (Math.random() - 0.5) * 0.01,
    longitude: bin.longitude || defaultCenter[1] + (Math.random() - 0.5) * 0.01,
  }));

  return (
    <div className="peta-view-container" style={{ height: "calc(100vh - 180px)", display: "flex", gap: 20 }}>
      {/* Sidebar List */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="card" 
        style={{ width: 320, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
          <div className="card-title" style={{ margin: 0 }}>📍 Daftar Unit VisioBin</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{enrichedBins.length} perangkat terdeteksi</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {enrichedBins.map((bin) => {
            const level = Math.round(((bin.latest_reading?.volume_organic_pct ?? 0) + (bin.latest_reading?.volume_inorganic_pct ?? 0)) / 2);
            const color = getBinLevelColor(level);
            return (
              <motion.div
                key={bin.id}
                whileHover={{ background: "var(--bg-hover)" }}
                onClick={() => setActiveBin(bin)}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  cursor: "pointer",
                  border: `1px solid ${activeBin?.id === bin.id ? color : "transparent"}`,
                  background: activeBin?.id === bin.id ? `${color}11` : "transparent",
                  marginBottom: 8,
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{bin.name}</span>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: bin.status === 'active' ? 'var(--brand-organic)' : '#f59e0b' }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{bin.location || "Lokasi tidak tersedia"}</div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar" style={{ height: 4 }}>
                      <div className="progress-fill" style={{ width: `${level}%`, background: color }} />
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: color }}>{level}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Map Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card" 
        style={{ flex: 1, padding: 0, overflow: "hidden", position: "relative" }}
      >
        <MapContainer 
          center={defaultCenter} 
          zoom={15} 
          style={{ height: "100%", width: "100%", background: "var(--bg-page)" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            // Use dark tiles for dark mode if possible, or just standard
          />
          <ChangeView center={mapCenter} zoom={activeBin ? 17 : 15} />
          
          {enrichedBins.map((bin) => {
            const level = Math.round(((bin.latest_reading?.volume_organic_pct ?? 0) + (bin.latest_reading?.volume_inorganic_pct ?? 0)) / 2);
            return (
              <Marker 
                key={bin.id} 
                position={[bin.latitude, bin.longitude]}
                icon={createCustomIcon(level)}
                eventHandlers={{
                  click: () => setActiveBin(bin),
                }}
              >
                <Popup>
                  <div style={{ minWidth: 180, color: "var(--text-main)" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{bin.name}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <Trash2 size={14} color="var(--brand-organic)" />
                        <span>Kapasitas: {level}%</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <Battery size={14} color="#f59e0b" />
                        <span>Baterai: 88%</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <Zap size={14} color="#22d3ee" />
                        <span>Sinyal: Kuat</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend Overlay */}
        <div style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          background: "var(--bg-card)",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 1000,
          pointerEvents: "none"
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Kapasitas Bin</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--brand-organic)" }} /> <span>Kosong / Aman</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} /> <span>Hampir Penuh</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} /> <span>Penuh (Segera Angkut)</span>
            </div>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .leaflet-container {
          filter: var(--theme-name) === 'dark' ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none';
        }
        .leaflet-tile-pane {
          filter: var(--map-filter);
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
