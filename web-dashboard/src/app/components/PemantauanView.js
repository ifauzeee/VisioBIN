"use client";

import React from 'react';
import { Video, Wifi, AlertTriangle, Clock3 } from 'lucide-react';
import { liveFeedSummary, liveFeedStreams, liveEventQueue } from '../dashboardData';

const ICONS_MAP = {
  'Stream Aktif': Video,
  'Uptime Jaringan': Wifi,
  'Peringatan Kritis': AlertTriangle
};

export default function PemantauanView() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 24, marginBottom: 24 }}>
        {liveFeedSummary.map(item => {
          const ItemIcon = ICONS_MAP[item.label] || Video;
          return (
            <div key={item.label} className="card live-summary-card">
              <div className="card-title">
                <ItemIcon size={16} color={item.tone} /> {item.label}
              </div>
              <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-1px', marginTop: 8 }}>
                {item.value}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                {item.note}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title"><Video size={16} /> Matriks Stream Kamera</div>
          <div className="live-feed-grid">
            {liveFeedStreams.map(s => (
              <div key={s.id} className="live-feed-tile">
                <div
                  className="live-feed-preview"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 20%, ${s.tint} 0%, transparent 60%), linear-gradient(180deg, var(--bg-hover) 0%, var(--bg-card) 100%)`
                  }}
                >
                  <div className="live-feed-scan" />
                  <div className={`status-chip ${s.status}`}>
                    {s.status === 'online' ? 'AKTIF' : s.status === 'degraded' ? 'TERDEGRADASI' : 'MATI'}
                  </div>
                  <div className="live-feed-id">{s.id}</div>
                </div>

                <div style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{s.zone}</div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.latency}</div>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Frame rate</span>
                    <span className="mono" style={{ color: 'var(--text-main)' }}>{s.fps} FPS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ minHeight: 420, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title"><Clock3 size={16} /> Antrean Kejadian</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {liveEventQueue.map(ev => (
              <div key={ev.id} className="event-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.type}</div>
                  <span className={`severity-chip ${ev.severity.toLowerCase()}`}>{ev.severity}</span>
                </div>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>{ev.source}</span>
                  <span className="mono">{ev.age}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}