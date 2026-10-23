# Material Readiness & Delivery Risk Monitoring Dashboard
**Sistem Pemantauan Kesiapan Material dan Analisis Risiko Pengiriman untuk Tim PPIC Manufaktur**

Dashboard profesional ini dirancang khusus untuk tim **PPIC (Production Planning & Inventory Control)**, Supply Chain, dan Inventory Control di industri manufaktur garmen/tekstil/perakitan untuk memantau ketersediaan material produksi, mendeteksi defisit kuantitas sebelum jadwal potong/jahit, mengidentifikasi kontradiksi data fisik vs sistem, serta menganalisis risiko keterlambatan material secara transparan.

---

## 1. Single Source of Truth: Google Sheets

Aplikasi menggunakan Google Spreadsheet sebagai **single source of truth** dengan sheet utama bernama **`"Rekap"`**.
Sheet pesanan individual seperti *OR 1095*, *OR 1014*, *OR 1036* dapat digunakan sebagai data pendukung/cross-reference, namun lembar **`"Rekap"`** dijadikan sumber utama agregasi agar kuantitas material tidak terhitung ganda (*avoid double counting*).

### Struktur Kolom Acuan (Kolom B s.d. J)

| Kolom | Nama Header Acuan | Field Aplikasi | Tipe Data | Peran & Validasi PPIC |
| :--- | :--- | :--- | :--- | :--- |
| **Kolom B** | `OR` | `or` | Teks | Nomor Order Rilis / Order Reference (misal: `OR 1095`) |
| **Kolom C** | `Style` | `style` | Teks | Model atau kode gaya produksi garmen (misal: `HOODIE-ST-01`) |
| **Kolom D** | `Tanggal` | `tanggalUpdate` | Tanggal/ISO | **WAKTU PEMBARUAN INFORMASI TERAKHIR** *(Bukan tanggal kebutuhan potong atau tanggal kedatangan)*. Digunakan untuk menghitung umur data (*data age*) dan peringatan *stale data*. |
| **Kolom E** | `Order Lines/Product/Display Name` | `displayName` | Teks | Nama lengkap material beserta kode unik dalam kurung siku `[KODE]` |
| **Kolom F** | `Order Lines/Quantity` | `quantity` | Numerik | Kebutuhan material untuk memenuhi pesanan produksi |
| **Kolom G** | `Order Lines/Received Qty` | `receivedQty` | Numerik | Kuantitas fisik material yang telah diterima di gudang |
| **Kolom H** | `Kekurangan/Kelebihan` | `kekuranganKelebihan` | Numerik | Selisih tercatat di sheet (`Received Qty - Quantity`), divalidasi silang |
| **Kolom I** | `Satuan` | `satuan` | Teks | Satuan resmi material: `YDS`, `GROS`, `DOZEN`, `PCS`, `ROLL`, `CONE` |
| **Kolom J** | `Ket` | `ket` | Teks | Status sumber dari lembar rekap: `OKE` atau `BELUM` |

---

## 2. Logika Status Kesiapan (*Material Readiness*)

Sistem menerapkan validasi ketat untuk mencegah kelalaian operasional atau kecurangan input:

- **`READY`**: Kuantitas kebutuhan terpenuhi 100% (`shortage === 0` atau `Received Qty >= Quantity`) **DAN** status sumber Kolom J menunjukkan `"OKE"`.
- **`NOT READY`**: Kuantitas belum terpenuhi (`shortage > 0`) atau status sumber Kolom J menunjukkan `"BELUM"`.
- **`CHECK DATA`**: Terjadi kontradiksi/inkonsistensi data yang memerlukan audit fisik ke gudang:
  - *Kasus 1:* Status tertulis `"OKE"`, namun kuantitas fisik masih memiliki kekurangan (`shortage > 0`).
  - *Kasus 2:* Status tertulis `"BELUM"`, namun kuantitas yang diterima sudah mencukupi kebutuhan 100%.
  - *Kasus 3:* Format angka tidak valid atau baris material tidak lengkap.

> **Protokol Satuan Aman:** Sistem tidak pernah menjumlahkan kuantitas dari satuan yang berbeda (misalnya menjumlahkan `YDS` kain dengan `GROS` kancing atau `DOZEN` kerah). Setiap agregasi defisit dikelompokkan secara terpisah berdasarkan kode material dan satuannya. Kelebihan material (*surplus*) ditampilkan terpisah dan tidak mengurangi defisit material lain.

---

## 3. Analisis Risiko Transparan (3 Kategori PPIC)

Sesuai aturan PPIC, risiko dianalisis dan diaudit melalui 3 kategori terpisah:

### A. Material Shortage Risk (Risiko Defisit Kuantitas)
- Mengukur keparahan defisit material terhadap kuantitas kebutuhan.
- Skor 0 - 100 berdasarkan rasio kekurangan dan status penerimaan awal (jika belum ada barang masuk sama sekali dan status BELUM, dikategorikan *CRITICAL*).

### B. Stale Data Risk (Risiko Keusangan Informasi Kolom D)
- Dihitung dari umur data sejak tanggal update terakhir pada Kolom D:
  - `0 - 3 hari`: *LOW* (Sangat mutakhir)
  - `4 - 7 hari`: *MEDIUM* (Normal)
  - `8 - 14 hari`: *HIGH* (Peringatan data usang)
  - `> 14 hari`: *CRITICAL* (Wajib konfirmasi ulang ke logistik/gudang)
- Ambang batas hari dapat dikonfigurasi fleksibel di menu **Settings**.

### C. Delivery Delay Risk (Risiko Keterlambatan Pengiriman)
- **Status:** `"Belum dapat dinilai: data jadwal pengiriman/kebutuhan belum tersedia pada sheet Rekap"`.
- Sistem tidak mencampuradukkan umur data Kolom D dengan keterlambatan pengiriman nyata.

### Formula Scoring Berbobot:
$$\text{Skor Risiko} = (\text{Skor Shortage} \times W_{\text{shortage}}) + (\text{Skor Stale Data} \times W_{\text{stale}}) + (\text{Skor Konsistensi} \times W_{\text{konsistensi}})$$
- Default bobot: **50% Shortage**, **30% Stale Data**, **20% Konsistensi**.
- Kategori Akhir: **LOW** (0-24), **MEDIUM** (25-49), **HIGH** (50-74), **CRITICAL** (75-100).

---

## 4. Cara Menghubungkan Google Sheets Nyata

### Opsi 1: Google Apps Script Web App (Direkomendasikan)
1. Buka Google Spreadsheet Anda yang memuat sheet **`"Rekap"`**.
2. Klik menu **Extensions (Ekstensi) > Apps Script**.
3. Buka tab menu **Data & Sync Status** pada dashboard web ini, lalu klik tombol **"Salin Kode Code.gs"**.
4. Tempelkan kode ke editor Apps Script, lalu klik **Deploy > New deployment**.
5. Pilih type **Web App**, set *Who has access* menjadi **"Anyone" (Siapa saja)**, lalu deploy.
6. Salin URL Web App yang berakhiran `/exec` dan tempelkan ke kolom URL di menu *Data & Sync Status*.
7. Klik **"Simpan & Hubungkan ke Apps Script"**.

### Opsi 2: Google Sheets CSV Export / ID
1. Bagikan Google Sheets dengan izin **"Anyone with the link can view"** (Pengakses lihat-saja).
2. Salin Spreadsheet ID dari link URL browser Anda (misal `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`).
3. Masukkan ke kolom Spreadsheet ID di menu *Data & Sync Status*.
4. Klik **"Simpan & Hubungkan Google Sheets"**.

### Opsi 3: Mode Simulasi / Benchmark PPIC
- Aktif secara bawaan ketika belum ada Google Sheet yang dihubungkan.
- Menyediakan dataset nyata 13 baris material (OR 1095, OR 1014, OR 1036, OR 1088) dengan berbagai satuan untuk pengujian dan pelatihan tim.

---

## 5. Fitur Otomatisasi & Refresh

- **Auto-Sync Berkala:** Dashboard melakukan polling data dari Google Sheets secara otomatis setiap **60 detik** (dapat diubah ke 30s, 120s, atau manual di menu Settings).
- **Indikator Countdown & Status:** Menampilkan sisa detik sebelum sinkronisasi berikutnya dan waktu terakhir pembaruan berhasil (WIB).
- **Tombol Refresh Manual:** Tombol *"Refresh Data"* di navbar untuk memperbarui data seketika.
- **Fail-Safe Caching:** Jika koneksi internet terputus atau API Google sementara tidak terjangkau, dashboard menampilkan peringatan galat tanpa menghapus data tampilan terakhir yang tersimpan di cache lokal.
