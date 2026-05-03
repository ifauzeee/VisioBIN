import React, { useState } from 'react';
import { Video, Wifi, AlertTriangle, Clock3, VideoOff, RefreshCw } from 'lucide-react';
import { liveFeedSummary, liveFeedStreams as initialStreams, liveEventQueue } from '../dashboardData';
import EmptyState from './shared/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

const ICONS_MAP = {
  'Stream Aktif': Video,
  'Uptime Jaringan': Wifi,
  'Peringatan Kritis': AlertTriangle
};

export default function PemantauanView() {
  const [streams, setStreams] = useState(initialStreams);
  const activeStreams = streams.filter(s => s.status !== 'offline');
  const allOffline = activeStreams.length === 0;

  const handleReconnect = () => {
    // Simulating reconnection
    setStreams(initialStreams);
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 24, marginBottom: 24 }}>
        {liveFeedSummary.map(item => {
          const ItemIcon = ICONS_MAP[item.label] || Video;
          return (
            <motion.div 
              key={item.label} 
              className="card live-summary-card"
              whileHover={{ y: -5 }}
            >
              <div className="card-title">
                <ItemIcon size={16} color={item.tone} /> {item.label}
              </div>
              <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-1px', marginTop: 8 }}>
                {allOffline && item.label === 'Stream Aktif' ? '0' : item.value}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                {allOffline && item.label === 'Stream Aktif' ? 'Semua kamera offline' : item.note}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card" style={{ minHeight: 400 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 0 }}><Video size={16} /> Matriks Stream Kamera</div>
            {allOffline && (
              <button 
                onClick={handleReconnect}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={12} /> Refresh Stream
              </button>
            )}
          </div>

          <div className="live-feed-grid">
            <AnimatePresence>
              {allOffline ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ gridColumn: '1 / -1', padding: '40px 0' }}
                >
                  <EmptyState 
                    icon={VideoOff}
                    title="Kamera Tidak Aktif"
                    description="Sistem AI tidak mendeteksi adanya stream aktif saat ini. Pastikan perangkat Edge (Raspberry Pi/Jetson) sudah terhubung ke jaringan."
                    action="Coba Hubungkan Kembali"
                    onAction={handleReconnect}
                  />
                </motion.div>
              ) : (
                streams.map(s => (
                  <motion.div 
                    key={s.id} 
                    className="live-feed-tile"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div
                      className="live-feed-preview"
                      style={{
                        backgroundImage: s.status === 'offline' 
                          ? 'none' 
                          : `radial-gradient(circle at 20% 20%, ${s.tint} 0%, transparent 60%), linear-gradient(180deg, var(--bg-hover) 0%, var(--bg-card) 100%)`,
                        backgroundColor: s.status === 'offline' ? 'rgba(0,0,0,0.2)' : 'transparent'
                      }}
                    >
                      {s.status !== 'offline' && <div className="live-feed-scan" />}
                      <div className={`status-chip ${s.status}`}>
                        {s.status === 'online' ? 'AKTIF' : s.status === 'degraded' ? 'TERDEGRADASI' : 'MATI'}
                      </div>
                      <div className="live-feed-id">{s.id}</div>
                      {s.status === 'offline' && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <VideoOff size={32} color="rgba(255,255,255,0.1)" />
                        </div>
                      )}
                    </div>

                    <div style={{ padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{s.zone}</div>
                        <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.status === 'offline' ? '---' : s.latency}</div>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>Frame rate</span>
                        <span className="mono" style={{ color: s.status === 'offline' ? 'var(--text-muted)' : 'var(--text-main)' }}>{s.status === 'offline' ? '0' : s.fps} FPS</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="card" style={{ minHeight: 420, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title"><Clock3 size={16} /> Antrean Kejadian</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {liveEventQueue.length > 0 ? (
              liveEventQueue.map(ev => (
                <motion.div 
                  key={ev.id} 
                  className="event-item"
                  whileHover={{ x: 4, background: 'var(--bg-hover)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.type}</div>
                    <span className={`severity-chip ${ev.severity.toLowerCase()}`}>{ev.severity}</span>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{ev.source}</span>
                    <span className="mono">{ev.age}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <EmptyState 
                title="Tidak ada kejadian" 
                description="Semua aktivitas sistem normal."
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}