# Sotrack v2.1.7 — GitHub Pages

Paket siap upload, tanpa npm atau proses build.

## Deploy pertama
1. Ekstrak ZIP ini terlebih dahulu.
2. Upload seluruh isinya ke repository GitHub. index.html harus berada di root repository, bukan dalam folder tambahan. Pertahankan folder vendor beserta isinya.
3. Buka Settings → Pages. Pilih Deploy from a branch, branch main (atau branch tempat file diupload), folder /(root), lalu Save.
4. Tunggu deployment selesai dan buka URL yang ditampilkan GitHub Pages.
5. Izinkan lokasi saat app meminta akses. Buka online sekali untuk menyiapkan PWA.

## Update versi sebelumnya
Backup JSON dari menu pengaturan, lalu simpan aktivitas yang sedang berjalan. Upload isi paket untuk mengganti file lama, termasuk sw.js dan folder vendor. Setelah deployment selesai, buka app dan tekan Perbarui app bila ditawarkan. Jangan hapus data browser untuk memperbarui.

## Pindah dari alamat preview / perangkat lain
Data disimpan pada browser dan alamat situs masing-masing. Backup JSON dari app lama, lalu pulihkan backup di alamat GitHub Pages. Data tidak berpindah otomatis. Jika alamat dan browser tetap sama, update file tidak sengaja menghapus data lokal.

## Fitur terbaru
- Peta penuh dengan dock ringkas pada layar kecil/pendek, tampilan landscape dan jam WIB.
- Panduan belokan, sisa tujuan, ETA saat bergerak, peringatan keluar jalur.
- Pilihan Klasik / Modern / Terang. Pada penggunaan awal di layar kecil, Klasik diprioritaskan; pilihan yang telah disimpan tetap dihormati.
- Replay aktivitas dengan speed, HR/zona, top speed dan timeline.
- Video replay ringkasan 30/60 detik: Aktivitas → Detail → Replay aktivitas → Buat video replay → Simpan video. MP4 atau WebM tergantung browser. Biarkan layar menyala; browser yang tidak mendukung dapat memakai perekam layar HP.
- Ekspor aktivitas GPX, CSV dan JSON lengkap.

## Batas yang perlu diketahui
64 tes logika lolos pada sumber versi ini. Tampilan fisik J2 Prime, GPS/Bluetooth dan ekspor video di HP asli belum diverifikasi. Browser lama belum dijamin kompatibel. Coba peta Klasik terlebih dahulu. Rekaman membutuhkan app aktif/layar menyala; background dan layar terkunci tidak dijamin. HR membutuhkan sensor BLE standar yang kompatibel. Data HR yang tidak direkam tidak dibuat-buat.

Peta online, pencarian, rute dan cuaca bergantung pada penyedia eksternal dan koneksi. Mode offline memakai area/rute yang disimpan sebelumnya, bukan unduhan peta Google. Data jalan tidak dijamin selalu sesuai kondisi lapangan. Tidak ada perhitungan ulang rute otomatis ketika keluar jalur.

File index.html harus diakses melalui HTTPS GitHub Pages, bukan dibuka lewat file://.
