# Panduan Role Pengguna VisioBIN

Dokumen ini merinci berbagai role (peran) yang tersedia dalam sistem VisioBIN, tanggung jawab mereka, serta tugas yang dapat mereka lakukan di Dashboard Web.

## Daftar Role & Tanggung Jawab

| Role | Nama (ID) | Deskripsi Singkat | Tanggung Jawab Utama |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | Pengelola sistem tertinggi. | Manajemen user, konfigurasi bin, audit sistem, dan akses penuh ke analytics. |
| **Operator / OB** | `operator` | Petugas lapangan / cleaning service. | Menanggapi alert bin penuh, mengosongkan sampah, dan mencatat log maintenance. |
| **Manager** | `manager` | Pengawas fasilitas / ESG Officer. | Memantau dashboard statistik, laporan keberlanjutan (ESG), dan efisiensi operasional. |
| **Teknisi** | `technician` | Pemelihara perangkat keras (IoT). | Memantau kesehatan sensor (baterai, konektivitas), reset perangkat, dan update konfigurasi teknis. |

---

## Tugas & Akses di Web Dashboard

### 1. Administrator (`admin`)
*   **User Management**: Menambah, mengedit, atau menghapus akun pengguna lain.
*   **Bin Configuration**: Mendaftarkan perangkat VisioBIN baru dan mengatur lokasi serta kapasitasnya.
*   **System Oversight**: Melihat log aktivitas sistem secara keseluruhan.
*   **Analytics Access**: Melihat laporan mendalam terkait pengurangan emisi CO2 dan produksi kompos.

### 2. Operator / OB (`operator`)
*   **Alert Monitoring**: Menerima notifikasi real-time jika bin penuh atau berbau (amonia tinggi).
*   **Emptying Logs**: Menandai bin sebagai "Sudah Dikosongkan" setelah melakukan tugas lapangan.
*   **Basic Dashboard**: Melihat status kapasitas bin secara real-time untuk merencanakan rute pembersihan.

### 3. Manager (`manager`)
*   **Reporting**: Mengunduh laporan bulanan klasifikasi sampah (organik vs anorganik).
*   **KPI Monitoring**: Melihat rata-rata waktu respon petugas dalam mengosongkan bin.
*   **Sustainability Dashboard**: Memantau dampak lingkungan dari sistem VisioBIN untuk kebutuhan laporan ESG.
*   **View-Only Access**: Dapat melihat data semua bin tapi tidak bisa mengubah konfigurasi teknis.

### 4. Teknisi (`technician`)
*   **Hardware Health**: Melihat status konektivitas terakhir (Last Seen) dan level gas amonia sebagai indikator kesehatan sensor.
*   **Maintenance Logs**: Mencatat perbaikan teknis pada komponen elektronik bin.
*   **API Management**: Mengambil API Key untuk konfigurasi perangkat IoT baru.

---

## Implementasi Teknis

Role ini diterapkan menggunakan middleware `RequireRole` di backend Go:
- `r.Use(middleware.RequireRole("admin"))` -> Akses terbatas Admin.
- `r.Use(middleware.RequireRole("admin", "operator"))` -> Akses Admin dan Petugas Lapangan.
- `r.Use(middleware.RequireRole("admin", "operator", "manager", "technician"))` -> Akses untuk semua role internal.
