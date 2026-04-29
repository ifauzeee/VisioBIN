"use client";

import React from 'react';
import { Cpu, Wifi, AlertTriangle } from 'lucide-react';
import { dataSensor } from '../dashboardData';

export default function PerangkatView() {
  const aktif = dataSensor.filter(s => s.status === 'aktif').length;
  const peringatan = dataSensor.filter(s => s.status === 'peringatan').length;

  return (
    <>
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title"><Cpu size={16} /> Total Sensor</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12 }}>{dataSensor.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>terpasang di unit stasiun</div>
        </div>

        <div className="card">
          <div className="card-title">
            <Wifi size={16} color="var(--brand-organic)" /> Sensor Aktif
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: 'var(--brand-organic)' }}>
            {aktif}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>beroperasi normal</div>
        </div>

        <div className="card">
          <div className="card-title">
            <AlertTriangle size={16} color="#f59e0b" /> Peringatan
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: '#f59e0b' }}>
            {peringatan}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>butuh pemeliharaan</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">📡 Status Sensor Perangkat IoT</div>
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <table className="report-table">
            <thead>
              <tr>
                <th>ID Sensor</th>
                <th>Tipe</th>
                <th>Lokasi</th>
                <th>Status</th>
                <th>Baterai</th>
                <th>Suhu</th>
              </tr>
            </thead>
            <tbody>
              {dataSensor.map(s => (
                <tr key={s.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{s.id}</td>
                  <td>{s.tipe}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.lokasi}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className={`status-dot ${s.status}`} />
                      <span style={{
                        textTransform: 'capitalize',
                        color: s.status === 'aktif' ? 'var(--brand-organic)' : '#f59e0b'
                      }}>
                        {s.status}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 60 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${s.baterai}%`,
                            background: s.baterai > 60 ? 'var(--brand-organic)' : s.baterai > 30 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="mono" style={{ fontSize: 12 }}>{s.baterai}%</span>
                    </div>
                  </td>
                  <td className="mono">{s.suhu}°C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-title" style={{ marginBottom: 16, paddingLeft: 4 }}>🔧 Detail Perangkat</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {dataSensor.map(s => (
          <div key={s.id} className="sensor-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className={`status-dot ${s.status}`} />
                <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{s.id}</span>
              </div>
              <span style={{
                fontSize: 11,
                color: s.status === 'aktif' ? 'var(--brand-organic)' : '#f59e0b',
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                {s.status}
              </span>
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{s.tipe}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>📍 {s.lokasi}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>🔋 Baterai</div>
                <div className="mono" style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: s.baterai > 60 ? 'var(--brand-organic)' : '#f59e0b'
                }}>
                  {s.baterai}%
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>🌡️ Suhu</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{s.suhu}°C</div>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              Update: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </div>
          </div>
        ))}
      </div>
    </>
  );
}