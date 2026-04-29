"use client";

import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  dataLaporanHarian, dataRingkasanMingguan, dataLingkunganBulanan
} from '../dashboardData';

export default function LaporanView() {
  const totalBulan = dataLaporanHarian.reduce((a, d) => a + d.totalItem, 0);
  const avgAkurasi = (
    dataLaporanHarian.reduce((a, d) => a + d.akurasi, 0) / dataLaporanHarian.length
  ).toFixed(1);

  return (
    <>
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">📦 Total Item Minggu Ini</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12 }}>{totalBulan}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            dari 7 hari terakhir
          </div>
        </div>

        <div className="card">
          <div className="card-title">🎯 Rata-rata Akurasi</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12 }}>{avgAkurasi}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            7 hari terakhir
          </div>
        </div>

        <div className="card">
          <div className="card-title">♻️ Tingkat Daur Ulang</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: 'var(--brand-organic)' }}>
            89%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>target: 85%</div>
        </div>

        <div className="card">
          <div className="card-title">🌍 Total CO2 Dicegah</div>
          <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: '#22d3ee' }}>
            60.5 kg
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            kumulatif 4 bulan
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">📋 Laporan Harian - 7 Hari Terakhir</div>
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <table className="report-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Total Item</th>
                <th>Organik</th>
                <th>Anorganik</th>
                <th>Akurasi</th>
                <th>Level Akhir</th>
              </tr>
            </thead>
            <tbody>
              {dataLaporanHarian.map(d => (
                <tr key={d.tanggal}>
                  <td style={{ fontWeight: 500 }}>{d.tanggal}</td>
                  <td className="mono">{d.totalItem}</td>
                  <td>
                    <span style={{ color: 'var(--brand-organic)' }} className="mono">
                      {d.organik}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--brand-inorganic)' }} className="mono">
                      {d.anorganik}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{ color: d.akurasi >= 97 ? 'var(--brand-organic)' : '#f59e0b' }}
                      className="mono"
                    >
                      {d.akurasi}%
                    </span>
                  </td>
                  <td className="mono">{d.levelAkhir}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card" style={{ minHeight: 320, display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">📉 Tren Lingkungan Bulanan</div>
          <div style={{ flex: 1, marginTop: 16, marginLeft: -20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataLingkunganBulanan} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="bulan" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="co2" stroke="#22d3ee" strokeWidth={2} dot={{ r: 4 }} name="CO2 Dicegah (kg)" />
                <Line yAxisId="right" type="monotone" dataKey="daurUlang" stroke="var(--brand-organic)" strokeWidth={2} dot={{ r: 4 }} name="Daur Ulang (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ minHeight: 320 }}>
          <div className="card-title">📊 Ringkasan Mingguan</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dataRingkasanMingguan.map(w => (
              <div
                key={w.minggu}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: 14,
                  background: 'rgba(255,255,255,0.015)'
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{w.minggu}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Total: </span>
                    <span className="mono">{w.total}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Akurasi: </span>
                    <span className="mono" style={{ color: 'var(--brand-organic)' }}>{w.akurasi}%</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Organik: </span>
                    <span className="mono" style={{ color: 'var(--brand-organic)' }}>{w.organik}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Anorganik: </span>
                    <span className="mono" style={{ color: 'var(--brand-inorganic)' }}>{w.anorganik}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">📊 Perbandingan Total Pemrosesan Mingguan</div>
        <div style={{ height: 280, marginTop: 16, marginLeft: -20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataRingkasanMingguan} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="minggu" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="organik" fill="var(--brand-organic)" radius={[4, 4, 0, 0]} name="Organik" />
              <Bar dataKey="anorganik" fill="var(--brand-inorganic)" radius={[4, 4, 0, 0]} name="Anorganik" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}