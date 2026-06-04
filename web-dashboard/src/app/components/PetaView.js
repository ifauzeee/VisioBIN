"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Battery, Zap, Trash2, Search, MapPin, Activity, AlertTriangle, X, Navigation, Wifi, SignalHigh, SignalMedium, SignalLow, Thermometer, CheckCircle2, Locate, Flame } from "lucide-react";
import { getBinLevelColor } from "../utils/formatters";
import { useTranslations } from 'next-intl';
import { useDashboardContext } from "../context/DashboardContext";

const DEFAULT_CENTER = [-6.3625, 106.8241];

function deterministicOffset(seed, axis) {
  const input = String(seed || "visiobin");
  let hash = axis === "lat" ? 17 : 31;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33 + input.charCodeAt(i)) % 997;
  }
  return (hash / 997 - 0.5) * 0.01;
}

function ChangeView({ LeafletComponents, center, zoom }) {
  const map = LeafletComponents.useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

function MapEventsController({ LeafletComponents, onZoomChange }) {
  LeafletComponents.useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}

export default function PetaView({ bins }) {
  const t = useTranslations('map');
  const { searchQuery, setSearchQuery } = useDashboardContext();
  const [activeBin, setActiveBin] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [LeafletComponents, setLeafletComponents] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => (
    typeof document === "undefined" ? true : !document.body.classList.contains("light-mode")
  ));
  const [zoom, setZoom] = useState(15);

  const getSignalStatus = (rssi) => {
    if (rssi === undefined || rssi === null) return t('noSignal') || 'Tidak Ada Sinyal';
    if (rssi >= -50) return t('strong') || 'Kuat';
    if (rssi >= -70) return t('good') || 'Sedang';
    return t('weak') || 'Lemah';
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(!document.body.classList.contains("light-mode"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadLeaflet = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } = await import("react-leaflet");

      setLeafletComponents({ L, MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents });
      setIsMounted(true);
    };

    loadLeaflet();
  }, []);

  const enrichedBins = useMemo(() => (bins || []).map((bin) => ({
    ...bin,
    latitude: bin.latitude || DEFAULT_CENTER[0] + deterministicOffset(bin.id || bin.name, "lat"),
    longitude: bin.longitude || DEFAULT_CENTER[1] + deterministicOffset(bin.id || bin.name, "lng"),
  })), [bins]);

  const getBinLevel = React.useCallback((bin) => {
    return Math.round(((bin.latest_reading?.volume_organic_pct ?? 0) + (bin.latest_reading?.volume_inorganic_pct ?? 0)) / 2);
  }, []);

  const isBinOffline = React.useCallback((bin) => {
    const status = String(bin.status || bin.connection_status || "").toLowerCase();
    return status.includes("offline") || status.includes("inactive") || status.includes("nonaktif");
  }, []);

  const getBinOperationalStatus = React.useCallback((bin) => {
    if (isBinOffline(bin)) return "offline";
    const level = getBinLevel(bin);
    if (level > 80) return "full";
    if (level > 60) return "nearFull";
    return "normal";
  }, [getBinLevel, isBinOffline]);

  const openPickupRoute = (bin) => {
    const lat = bin.latitude || DEFAULT_CENTER[0];
    const lng = bin.longitude || DEFAULT_CENTER[1];
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank", "noopener,noreferrer");
  };

  // Filter & search bins
  const filteredBins = useMemo(() => {
    let result = enrichedBins;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(bin =>
        bin.name?.toLowerCase().includes(q) ||
        bin.location?.toLowerCase().includes(q)
      );
    }

    if (activeFilter !== "all") {
      result = result.filter(bin => {
        const level = getBinLevel(bin);
        switch (activeFilter) {
          case "empty": return level <= 60;
          case "normal": return getBinOperationalStatus(bin) === "normal";
          case "nearFull": return level > 60 && level <= 80;
          case "full": return level > 80;
          case "offline": return isBinOffline(bin);
          default: return true;
        }
      });
    }

    return result;
  }, [enrichedBins, searchQuery, activeFilter, getBinLevel, getBinOperationalStatus, isBinOffline]);

  const getGridSize = (zoomLevel) => {
    if (zoomLevel >= 17) return 0; // No clustering at very high zoom
    if (zoomLevel === 16) return 0.0015;
    if (zoomLevel === 15) return 0.003;
    if (zoomLevel === 14) return 0.006;
    if (zoomLevel === 13) return 0.012;
    return 0.024; // lower zooms
  };

  const getClusterAverageLevel = (clusterBins) => {
    if (clusterBins.length === 0) return 0;
    const sum = clusterBins.reduce((acc, bin) => acc + getBinLevel(bin), 0);
    return Math.round(sum / clusterBins.length);
  };

  const createClusterIcon = (binsInCluster) => {
    const { L } = LeafletComponents;
    const avgLevel = getClusterAverageLevel(binsInCluster);
    const color = getBinLevelColor(avgLevel);
    const count = binsInCluster.length;
    
    return L.divIcon({
      className: "custom-cluster-marker",
      html: `
        <div style="
          width: 42px;
          height: 42px;
          background: var(--bg-card);
          border: 3px double ${color};
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
          position: relative;
        ">
          <span style="
            font-size: 13px;
            font-weight: 800;
            color: var(--text-main);
            line-height: 1;
          ">${count}</span>
          <span style="
            font-size: 8px;
            font-weight: 600;
            color: ${color};
            font-family: 'JetBrains Mono', monospace;
            line-height: 1;
            margin-top: 2px;
          ">${avgLevel}%</span>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });
  };

  const clusteredItems = useMemo(() => {
    const gridSize = getGridSize(zoom);
    if (gridSize === 0) {
      return filteredBins.map(bin => ({
        isCluster: false,
        bin,
        latitude: bin.latitude,
        longitude: bin.longitude
      }));
    }

    const clusters = [];
    filteredBins.forEach(bin => {
      let foundCluster = null;
      for (const cluster of clusters) {
        const latDiff = Math.abs(cluster.latitude - bin.latitude);
        const lngDiff = Math.abs(cluster.longitude - bin.longitude);
        if (latDiff < gridSize && lngDiff < gridSize) {
          foundCluster = cluster;
          break;
        }
      }

      if (foundCluster) {
        foundCluster.bins.push(bin);
        foundCluster.latitude = foundCluster.bins.reduce((sum, b) => sum + b.latitude, 0) / foundCluster.bins.length;
        foundCluster.longitude = foundCluster.bins.reduce((sum, b) => sum + b.longitude, 0) / foundCluster.bins.length;
      } else {
        clusters.push({
          isCluster: true,
          bins: [bin],
          latitude: bin.latitude,
          longitude: bin.longitude
        });
      }
    });

    return clusters.map((c, i) => {
      if (c.bins.length === 1) {
        return {
          isCluster: false,
          bin: c.bins[0],
          latitude: c.latitude,
          longitude: c.longitude
        };
      }
      return {
        isCluster: true,
        id: `cluster-${c.bins[0].id ?? i}`,
        bins: c.bins,
        latitude: c.latitude,
        longitude: c.longitude
      };
    });
  }, [filteredBins, zoom]);

  // KPI calculations
  const kpiStats = useMemo(() => {
    const total = enrichedBins.length;
    const active = enrichedBins.filter(b => b.status === 'active').length;
    const levels = enrichedBins.map(getBinLevel);
    const avg = total > 0 ? Math.round(levels.reduce((a, b) => a + b, 0) / total) : 0;
    const full = levels.filter(l => l > 80).length;
    const offline = enrichedBins.filter(isBinOffline).length;
    return { total, active, avg, full, offline };
  }, [enrichedBins, getBinLevel, isBinOffline]);

  const createCustomIcon = (level) => {
    const { L } = LeafletComponents;
    const color = getBinLevelColor(level);
    const pulseClass = level > 80 ? 'map-marker-pulse-danger' : level > 60 ? 'map-marker-pulse-warning' : 'map-marker-pulse-safe';
    return L.divIcon({
      className: "custom-bin-marker",
      html: `
        <div style="
          width: 38px;
          height: 38px;
          background: var(--bg-card);
          border: 2.5px solid ${color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
          animation: ${pulseClass} 2s infinite;
          position: relative;
        ">
          <span style="
            font-size: 10px;
            font-weight: 700;
            color: ${color};
            font-family: 'JetBrains Mono', monospace;
            line-height: 1;
          ">${level}%</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  };

  const handleBinClick = (bin) => {
    setActiveBin(bin);
  };

  const mapCenter = activeBin
    ? [activeBin.latitude || DEFAULT_CENTER[0], activeBin.longitude || DEFAULT_CENTER[1]]
    : DEFAULT_CENTER;

  // Loading state
  if (!isMounted || !LeafletComponents) {
    return (
      <div>
        {/* KPI Shimmer */}
        <div className="map-kpi-strip">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="map-kpi-card">
              <div className="skeleton-shimmer" style={{ width: 36, height: 36, borderRadius: 10 }} />
              <div className="map-kpi-info">
                <div className="skeleton-shimmer" style={{ width: 40, height: 18, borderRadius: 5 }} />
                <div className="skeleton-shimmer" style={{ width: 60, height: 11, borderRadius: 4, marginTop: 3 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="map-loading">
          <div className="map-loading-content">
            <div className="map-loading-spinner" />
            <div className="map-loading-text">{t('initMap')}</div>
          </div>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Circle } = LeafletComponents;

  const filters = [
    { key: "all", label: t('filterAll'), activeClass: "active" },
    { key: "normal", label: t('filterNormal'), activeClass: "active" },
    { key: "nearFull", label: t('filterNearFull'), activeClass: "active-warning" },
    { key: "full", label: t('filterFull'), activeClass: "active-danger" },
    { key: "offline", label: t('filterOffline'), activeClass: "active-danger" },
  ];

  return (
    <div>
      {/* KPI Strip */}
      <motion.div
        className="map-kpi-strip"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="map-kpi-card">
          <div className="map-kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.12)' }}>
            <Trash2 size={17} color="#3B82F6" />
          </div>
          <div className="map-kpi-info">
            <div className="map-kpi-value">{kpiStats.total}</div>
            <div className="map-kpi-label">{t('totalUnits')}</div>
          </div>
        </div>

        <div className="map-kpi-card">
          <div className="map-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)' }}>
            <Activity size={17} color="#10B981" />
          </div>
          <div className="map-kpi-info">
            <div className="map-kpi-value" style={{ color: 'var(--brand-organic)' }}>{kpiStats.active}</div>
            <div className="map-kpi-label">{t('activeUnits')}</div>
          </div>
        </div>

        <div className="map-kpi-card">
          <div className="map-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)' }}>
            <Navigation size={17} color="#f59e0b" />
          </div>
          <div className="map-kpi-info">
            <div className="map-kpi-value" style={{ color: '#f59e0b' }}>{kpiStats.avg}%</div>
            <div className="map-kpi-label">{t('avgCapacity')}</div>
          </div>
        </div>

        <div className="map-kpi-card">
          <div className="map-kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.12)' }}>
            <AlertTriangle size={17} color="#ef4444" />
          </div>
          <div className="map-kpi-info">
            <div className="map-kpi-value" style={{ color: '#ef4444' }}>{kpiStats.full}</div>
            <div className="map-kpi-label">{t('fullUnits')}</div>
          </div>
        </div>

        <div className="map-kpi-card">
          <div className="map-kpi-icon" style={{ background: 'rgba(148, 163, 184, 0.12)' }}>
            <Zap size={17} color="var(--text-muted)" />
          </div>
          <div className="map-kpi-info">
            <div className="map-kpi-value" style={{ color: 'var(--text-muted)' }}>{kpiStats.offline}</div>
            <div className="map-kpi-label">{t('offlineUnits')}</div>
          </div>
        </div>
      </motion.div>

      {/* Main Layout: Sidebar + Map */}
      <div className="map-main-layout">
        {/* Sidebar */}
        <motion.div
          className="map-sidebar"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* Sidebar Header */}
          <div className="map-sidebar-header">
            <div className="map-sidebar-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16} color="var(--brand-organic)" /> {t('unitList')}</span>
              <span className="map-sidebar-count">{filteredBins.length} {t('unitsDetected')}</span>
            </div>
            <div className="map-search-wrapper">
              <Search size={14} className="map-search-icon" />
              <input
                type="text"
                className="map-search-input"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Heatmap Toggle & Filter Chips */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              Filter
            </span>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              style={{
                background: showHeatmap ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${showHeatmap ? 'rgba(139, 92, 246, 0.4)' : 'var(--border-color)'}`,
                borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                color: showHeatmap ? '#a78bfa' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s'
              }}
              aria-label="Toggle Heatmap View"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Flame size={16} color={showHeatmap ? "#f97316" : "var(--text-muted)"} /> {showHeatmap ? 'Heatmap Aktif' : 'Tampilan Heatmap'}</span>
            </button>
          </div>

          <div className="map-filter-chips">
            {filters.map(f => (
              <button
                key={f.key}
                className={`map-filter-chip ${activeFilter === f.key ? f.activeClass : ''}`}
                onClick={() => setActiveFilter(f.key)}
                aria-label={`Filter stasiun: ${f.label}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Bin List */}
          <div className="map-bin-list">
            {filteredBins.length === 0 ? (
              <div className="map-empty-state">
                <div className="map-empty-state-icon">
                  <Trash2 size={24} color="var(--text-muted)" />
                </div>
                <div className="map-empty-state-title">{t('noData')}</div>
              </div>
            ) : (
              filteredBins.map((bin, index) => {
                const level = getBinLevel(bin);
                const color = getBinLevelColor(level);
                const isSelected = activeBin?.id === bin.id;
                return (
                  <motion.div
                    key={bin.id ?? index}
                    className={`map-bin-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleBinClick(bin)}
                    whileTap={{ scale: 0.98 }}
                    layout
                  >
                    <div className="map-bin-item-header">
                      <div className="map-bin-item-name">
                        <div className={`map-bin-status-dot ${bin.status === 'active' ? 'active' : 'inactive'}`} />
                        {bin.name}
                      </div>
                      <span className="map-bin-item-level" style={{ color }}>{level}%</span>
                    </div>
                    <div className="map-bin-item-location">
                      <MapPin size={10} />
                      {bin.location || t('noLocation')}
                    </div>
                    <div className={`map-bin-operational-status status-${getBinOperationalStatus(bin)}`}>
                      {t(`status_${getBinOperationalStatus(bin)}`)}
                    </div>
                    <div className="map-bin-item-stats">
                      <div className="map-bin-item-bar-wrapper">
                        <div className="map-bin-item-bar">
                          <div
                            className="map-bin-item-bar-fill"
                            style={{ width: `${level}%`, background: color }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="map-sidebar-footer">
            <div className="map-sidebar-stat">
              <div className="map-sidebar-stat-value" style={{ color: 'var(--brand-organic)' }}>
                {enrichedBins.filter(b => getBinLevel(b) <= 60).length}
              </div>
              <div className="map-sidebar-stat-label">{t('safe')}</div>
            </div>
            <div className="map-sidebar-stat">
              <div className="map-sidebar-stat-value" style={{ color: '#f59e0b' }}>
                {enrichedBins.filter(b => { const l = getBinLevel(b); return l > 60 && l <= 80; }).length}
              </div>
              <div className="map-sidebar-stat-label">{t('nearFull')}</div>
            </div>
            <div className="map-sidebar-stat">
              <div className="map-sidebar-stat-value" style={{ color: '#ef4444' }}>
                {enrichedBins.filter(b => getBinLevel(b) > 80).length}
              </div>
              <div className="map-sidebar-stat-label">{t('full')}</div>
            </div>
          </div>
        </motion.div>

        {/* Map Container */}
        <motion.div
          className={`map-container-wrapper ${isDarkMode ? 'dark-map-tiles' : ''}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={15}
            style={{ height: "100%", width: "100%", background: isDarkMode ? '#1a1a2e' : '#f8fafc' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView LeafletComponents={LeafletComponents} center={mapCenter} zoom={activeBin ? 17 : 15} />
            <MapEventsController LeafletComponents={LeafletComponents} onZoomChange={setZoom} />

            {!showHeatmap ? (
              clusteredItems.map((item, index) => {
                if (item.isCluster) {
                  return (
                    <Marker
                      key={item.id ?? `cluster-${index}`}
                      position={[item.latitude, item.longitude]}
                      icon={createClusterIcon(item.bins)}
                      eventHandlers={{
                        click: (e) => {
                          const map = e.target._map;
                          if (map) {
                            map.flyTo([item.latitude, item.longitude], Math.min(map.getZoom() + 2, 18), { duration: 0.6 });
                          }
                        }
                      }}
                    />
                  );
                }

                const { bin } = item;
                const level = getBinLevel(bin);
                return (
                  <Marker
                    key={bin.id ?? `marker-${index}`}
                    position={[bin.latitude, bin.longitude]}
                    icon={createCustomIcon(level)}
                    eventHandlers={{
                      click: () => handleBinClick(bin),
                    }}
                  >
                    <Popup>
                      <div className="map-popup-content">
                        <div className="map-popup-title">{bin.name}</div>
                        <div className="map-popup-location">
                          <MapPin size={10} />
                          {bin.location || t('noLocation')}
                        </div>
                        <div className="map-popup-stats">
                          <div className="map-popup-stat-row">
                            <div className="map-popup-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                              <Trash2 size={14} color="var(--brand-organic)" />
                            </div>
                            <div>
                              <div className="map-popup-stat-label">{t('capacity')}</div>
                              <div className="map-popup-stat-value" style={{ color: getBinLevelColor(level) }}>{level}%</div>
                            </div>
                          </div>
                          <div className="map-popup-stat-row">
                            <div className="map-popup-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                              <Battery size={14} color="#f59e0b" />
                            </div>
                            <div>
                              <div className="map-popup-stat-label">{t('battery')}</div>
                              <div className="map-popup-stat-value">{bin.battery_pct ?? bin.latest_reading?.battery_pct ?? 100}%</div>
                            </div>
                          </div>
                          <div className="map-popup-stat-row">
                            <div className="map-popup-stat-icon" style={{ background: 'rgba(34, 211, 238, 0.1)' }}>
                              <Zap size={14} color="#22d3ee" />
                            </div>
                            <div>
                              <div className="map-popup-stat-label">{t('signal')}</div>
                              <div className="map-popup-stat-value">
                                {getSignalStatus(bin.wifi_rssi_dbm ?? bin.latest_reading?.wifi_rssi_dbm)}
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>
                                  ({bin.wifi_rssi_dbm ?? bin.latest_reading?.wifi_rssi_dbm ?? -50} dBm)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="map-popup-bar">
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                            <span style={{ color: 'var(--text-muted)' }}>{t('level')}</span>
                            <span style={{ fontWeight: 600, color: getBinLevelColor(level) }}>{level}%</span>
                          </div>
                        <div className="map-popup-bar-track">
                            <div className="map-popup-bar-fill" style={{ width: `${level}%`, background: getBinLevelColor(level) }} />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="map-route-button"
                          onClick={() => openPickupRoute(bin)}
                        >
                          <Navigation size={13} />
                          {t('createRoute')}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })
            ) : (
              enrichedBins.map((bin, index) => {
                const level = getBinLevel(bin);
                const color = level > 80 ? '#ef4444' : level > 60 ? '#f59e0b' : 'var(--brand-organic)';
                return (
                  <Circle
                    key={`heatmap-${bin.id ?? index}`}
                    center={[bin.latitude, bin.longitude]}
                    radius={180} // 180 meters radius
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.45,
                      color: 'transparent',
                      weight: 0
                    }}
                  />
                );
              })
            )}
          </MapContainer>

          {/* Legend Overlay */}
          <motion.div
            className="map-legend"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="map-legend-title">{t('capacity')}</div>
            <div className="map-legend-items">
              <div className="map-legend-item">
                <div className="map-legend-dot" style={{ background: 'var(--brand-organic)' }} />
                <span>{t('safe')}</span>
              </div>
              <div className="map-legend-item">
                <div className="map-legend-dot" style={{ background: '#f59e0b' }} />
                <span>{t('nearFull')}</span>
              </div>
              <div className="map-legend-item">
                <div className="map-legend-dot" style={{ background: '#ef4444' }} />
                <span>{t('full')}</span>
              </div>
            </div>
          </motion.div>

          {/* Detail Panel */}
          <AnimatePresence>
            {activeBin && (
              <motion.div
                className="map-detail-panel"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="map-detail-header">
                  <div>
                    <div className="map-detail-title">{activeBin.name}</div>
                    <div className="map-detail-subtitle">
                      <MapPin size={10} />
                      {activeBin.location || t('noLocation')}
                    </div>
                  </div>
                  <button className="map-detail-close" onClick={() => setActiveBin(null)}>
                    <X size={14} />
                  </button>
                </div>

                {/* Metric Cards */}
                <div className="map-detail-grid">
                  <div className="map-detail-metric">
                    <div className="map-detail-metric-label">{t('battery')}</div>
                    <div className="map-detail-metric-value" style={{ color: '#f59e0b' }}>
                      {activeBin.battery_pct ?? activeBin.latest_reading?.battery_pct ?? 100}%
                    </div>
                  </div>
                  <div className="map-detail-metric">
                    <div className="map-detail-metric-label">{t('signal')}</div>
                    <div className="map-detail-metric-value" style={{ color: '#22d3ee' }}>
                      {getSignalStatus(activeBin.wifi_rssi_dbm ?? activeBin.latest_reading?.wifi_rssi_dbm)}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: 4 }}>
                        ({activeBin.wifi_rssi_dbm ?? activeBin.latest_reading?.wifi_rssi_dbm ?? -50} dBm)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Organic / Inorganic Bars */}
                <div className="map-detail-bars">
                  <div className="map-detail-bar-item">
                    <div className="map-detail-bar-header">
                      <span className="map-detail-bar-label">{t('organic')}</span>
                      <span className="map-detail-bar-value" style={{ color: 'var(--brand-organic)' }}>
                        {activeBin.latest_reading?.volume_organic_pct ?? 0}%
                      </span>
                    </div>
                    <div className="map-detail-bar-track">
                      <div
                        className="map-detail-bar-fill"
                        style={{
                          width: `${activeBin.latest_reading?.volume_organic_pct ?? 0}%`,
                          background: 'var(--brand-organic)'
                        }}
                      />
                    </div>
                  </div>
                  <div className="map-detail-bar-item">
                    <div className="map-detail-bar-header">
                      <span className="map-detail-bar-label">{t('inorganic')}</span>
                      <span className="map-detail-bar-value" style={{ color: 'var(--brand-inorganic)' }}>
                        {activeBin.latest_reading?.volume_inorganic_pct ?? 0}%
                      </span>
                    </div>
                    <div className="map-detail-bar-track">
                      <div
                        className="map-detail-bar-fill"
                        style={{
                          width: `${activeBin.latest_reading?.volume_inorganic_pct ?? 0}%`,
                          background: 'var(--brand-inorganic)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                {(() => {
                  const level = getBinLevel(activeBin);
                  const statusClass = level > 80 ? 'status-danger' : level > 60 ? 'status-warning' : 'status-safe';
                  const statusText = level > 80 ? t('full') : level > 60 ? t('nearFull') : t('safe');
                  return (
                    <div className={`map-detail-status ${statusClass}`}>
                      {level > 80 ? <AlertTriangle size={14} /> : level > 60 ? <AlertTriangle size={14} /> : <Activity size={14} />}
                      {statusText}
                    </div>
                  );
                })()}

                <div className="map-detail-actions">
                  <button type="button" className="map-route-button" onClick={() => openPickupRoute(activeBin)}>
                    <Navigation size={14} />
                    {t('createRoute')}
                  </button>
                  <button type="button" className="map-secondary-button" onClick={() => setActiveFilter(getBinOperationalStatus(activeBin))}>
                    <Activity size={14} />
                    {t('filterSimilar')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes map-marker-pulse-danger {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes map-marker-pulse-warning {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes map-marker-pulse-safe {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.3); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
