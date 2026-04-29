export const dataVolumePerJam = [
  { jam: '06:00', volume: 5 },
  { jam: '07:00', volume: 8 },
  { jam: '08:00', volume: 14 },
  { jam: '09:00', volume: 22 },
  { jam: '10:00', volume: 31 },
  { jam: '11:00', volume: 39 },
  { jam: '12:00', volume: 48 },
  { jam: '13:00', volume: 55 },
  { jam: '14:00', volume: 61 },
];

export const dataKlasifikasiHarian = [
  { hari: 'Sen', organik: 45, anorganik: 32 },
  { hari: 'Sel', organik: 52, anorganik: 38 },
  { hari: 'Rab', organik: 48, anorganik: 41 },
  { hari: 'Kam', organik: 61, anorganik: 35 },
  { hari: 'Jum', organik: 55, anorganik: 43 },
  { hari: 'Sab', organik: 38, anorganik: 28 },
  { hari: 'Min', organik: 42, anorganik: 31 },
];

export const dataDistribusiSampah = [
  { name: 'Botol Plastik', value: 28, color: '#3B82F6' },
  { name: 'Sisa Makanan', value: 22, color: '#10B981' },
  { name: 'Kertas/Kardus', value: 18, color: '#F59E0B' },
  { name: 'Kaleng', value: 12, color: '#8B5CF6' },
  { name: 'Daun/Ranting', value: 11, color: '#06B6D4' },
  { name: 'Lainnya', value: 9, color: '#EF4444' },
];

export const dataRingkasanMingguan = [
  { minggu: 'Minggu 1 Apr', total: 312, organik: 178, anorganik: 134, akurasi: 96.2 },
  { minggu: 'Minggu 2 Apr', total: 345, organik: 192, anorganik: 153, akurasi: 97.1 },
  { minggu: 'Minggu 3 Apr', total: 298, organik: 165, anorganik: 133, akurasi: 96.8 },
  { minggu: 'Minggu 4 Apr', total: 367, organik: 201, anorganik: 166, akurasi: 97.5 },
];

export const dataLingkunganBulanan = [
  { bulan: 'Jan', co2: 12.4, daurUlang: 78 },
  { bulan: 'Feb', co2: 14.2, daurUlang: 82 },
  { bulan: 'Mar', co2: 15.8, daurUlang: 85 },
  { bulan: 'Apr', co2: 18.1, daurUlang: 89 },
];

export const dataTrenAkurasiHarian = [
  { hari: 'Sen', akurasi: 95.2 },
  { hari: 'Sel', akurasi: 96.1 },
  { hari: 'Rab', akurasi: 96.8 },
  { hari: 'Kam', akurasi: 97.3 },
  { hari: 'Jum', akurasi: 97.8 },
  { hari: 'Sab', akurasi: 96.9 },
  { hari: 'Min', akurasi: 97.5 },
];

export const dataSensor = [
  { id: 'SENS-01', tipe: 'Ultrasonik', lokasi: 'Atas Tempat Sampah', status: 'aktif', baterai: 87, suhu: 32 },
  { id: 'SENS-02', tipe: 'Kamera AI', lokasi: 'Mulut Tempat Sampah', status: 'aktif', baterai: 92, suhu: 38 },
  { id: 'SENS-03', tipe: 'Load Cell', lokasi: 'Dasar Tempat Sampah', status: 'aktif', baterai: 74, suhu: 30 },
  { id: 'SENS-04', tipe: 'Sensor Gas', lokasi: 'Interior Bin', status: 'peringatan', baterai: 45, suhu: 35 },
  { id: 'SENS-05', tipe: 'Kelembapan', lokasi: 'Kompartemen', status: 'aktif', baterai: 81, suhu: 33 },
];

export const dataLaporanHarian = [
  { tanggal: '29 Apr 2026', totalItem: 87, organik: 48, anorganik: 39, akurasi: 97.8, levelAkhir: 61 },
  { tanggal: '28 Apr 2026', totalItem: 92, organik: 55, anorganik: 37, akurasi: 97.2, levelAkhir: 54 },
  { tanggal: '27 Apr 2026', totalItem: 78, organik: 42, anorganik: 36, akurasi: 96.5, levelAkhir: 48 },
  { tanggal: '26 Apr 2026', totalItem: 85, organik: 47, anorganik: 38, akurasi: 97.1, levelAkhir: 43 },
  { tanggal: '25 Apr 2026', totalItem: 91, organik: 51, anorganik: 40, akurasi: 96.9, levelAkhir: 38 },
  { tanggal: '24 Apr 2026', totalItem: 74, organik: 39, anorganik: 35, akurasi: 96.2, levelAkhir: 32 },
  { tanggal: '23 Apr 2026', totalItem: 83, organik: 46, anorganik: 37, akurasi: 97.4, levelAkhir: 27 },
];

export const dataPemrosesanPerJam = [
  { jam: '06:00', items: 3 },
  { jam: '07:00', items: 5 },
  { jam: '08:00', items: 8 },
  { jam: '09:00', items: 12 },
  { jam: '10:00', items: 15 },
  { jam: '11:00', items: 11 },
  { jam: '12:00', items: 18 },
  { jam: '13:00', items: 14 },
  { jam: '14:00', items: 9 },
  { jam: '15:00', items: 7 },
  { jam: '16:00', items: 6 },
];

export const liveFeedSummary = [
  { label: 'Stream Aktif', value: '08', tone: '#10B981', note: '2 cadangan siap pakai' },
  { label: 'Uptime Jaringan', value: '99.94%', tone: '#22d3ee', note: '7 hari terakhir' },
  { label: 'Peringatan Kritis', value: '03', tone: '#f59e0b', note: 'butuh validasi operator' },
];

export const liveFeedStreams = [
  { id: 'CAM-01', zone: 'Gerbang Utara', fps: 29, latency: '22ms', status: 'online', tint: 'rgba(16,185,129,0.24)' },
  { id: 'CAM-02', zone: 'Jalur Sortir A', fps: 31, latency: '19ms', status: 'online', tint: 'rgba(59,130,246,0.24)' },
  { id: 'CAM-03', zone: 'Jalur Sortir B', fps: 27, latency: '34ms', status: 'degraded', tint: 'rgba(245,158,11,0.25)' },
  { id: 'CAM-04', zone: 'Dock Pembuangan', fps: 30, latency: '24ms', status: 'online', tint: 'rgba(34,211,238,0.22)' },
];

export const liveEventQueue = [
  { id: 1, type: 'Lonjakan Frame Drop', source: 'CAM-03', severity: 'Sedang', age: '00:42' },
  { id: 2, type: 'Dugaan Kemacetan Objek', source: 'Sensor Belt', severity: 'Tinggi', age: '01:12' },
  { id: 3, type: 'Peringatan Suhu GPU', source: 'GPU Edge-02', severity: 'Sedang', age: '02:05' },
  { id: 4, type: 'Gerakan Tidak Dikenal', source: 'CAM-01', severity: 'Rendah', age: '04:11' },
];

export const analyticsSummary = [
  { label: 'Akurasi Sortir', value: '97.8%', delta: '+1.3%', tone: '#10B981' },
  { label: 'Waktu Keputusan Rata-rata', value: '38ms', delta: '-4ms', tone: '#22d3ee' },
  { label: 'Kesalahan Klasifikasi', value: '2.2%', delta: '-0.7%', tone: '#f59e0b' },
  { label: 'Throughput Harian', value: '18.4rb', delta: '+8.9%', tone: '#f97316' },
];

export const analyticsTrend = [
  { waktu: '06:00', throughput: 1800, kepercayaan: 91 },
  { waktu: '08:00', throughput: 3200, kepercayaan: 93 },
  { waktu: '10:00', throughput: 4100, kepercayaan: 94 },
  { waktu: '12:00', throughput: 5400, kepercayaan: 96 },
  { waktu: '14:00', throughput: 6200, kepercayaan: 95 },
  { waktu: '16:00', throughput: 7100, kepercayaan: 97 },
];

export const analyticsSplit = [
  { label: 'Input Konveyor', value: 64, tone: '#10B981' },
  { label: 'Titik Drop Manual', value: 24, tone: '#22d3ee' },
  { label: 'Retry Sensor', value: 12, tone: '#f59e0b' },
];

export const analyticsStations = [
  { id: 'Stasiun-01', uptime: '99.9%', akurasi: '98.4%', antrian: 4 },
  { id: 'Stasiun-02', uptime: '99.7%', akurasi: '97.6%', antrian: 7 },
  { id: 'Stasiun-03', uptime: '98.8%', akurasi: '96.9%', antrian: 11 },
  { id: 'Stasiun-04', uptime: '99.3%', akurasi: '97.2%', antrian: 5 },
];

export const dampakLingkungan = [
  { label: 'Sampah Didaur Ulang', value: '89%', desc: 'Dari total sampah anorganik', tone: '#10B981' },
  { label: 'CO2 Dicegah Bulan Ini', value: '18.1 kg', desc: 'Setara 4 pohon ditanam', tone: '#22d3ee' },
  { label: 'Kompos Dihasilkan', value: '12.4 kg', desc: 'Dari sampah organik', tone: '#8B5CF6' },
  { label: 'Efisiensi Pemilahan', value: '97.5%', desc: 'Target: 95%', tone: '#f59e0b' },
];

export const defaultLogs = [
  { id: 'd-1', item: 'Botol Plastik', time: '14:22:18', type: 'tempat-sampah', prob: 96.2 },
  { id: 'd-2', item: 'Kulit Apel', time: '14:21:07', type: 'tempat-sampah', prob: 93.7 },
  { id: 'd-3', item: 'Gelas Kertas', time: '14:19:53', type: 'tempat-sampah', prob: 91.5 },
  { id: 'd-4', item: 'Kaleng Soda', time: '14:17:32', type: 'tempat-sampah', prob: 95.1 },
  { id: 'd-5', item: 'Sisa Nasi', time: '14:15:44', type: 'tempat-sampah', prob: 92.8 },
];