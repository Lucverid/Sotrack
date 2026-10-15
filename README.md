# Sotrack v2.1.4 — GitHub Pages

Web app sepeda berbasis GPS, peta OpenStreetMap, rute online/offline, navigasi belokan, ETA kecepatan saat ini dan sensor Bluetooth BLE.

## Deploy paling mudah

1. Ekstrak ZIP ini. Jangan upload ZIP-nya langsung.
2. Buat repository GitHub baru, contoh nama `sotrack`. Untuk GitHub Free, gunakan repository Public.
3. Buka repo → Add file → Upload files.
4. Upload seluruh isi hasil ekstrak, termasuk `index.html`, semua JS/CSS, `manifest.webmanifest`, `icon.svg`, `sw.js`, dan `.nojekyll`. Folder `tests` boleh ikut diupload. Pastikan `index.html` berada langsung di halaman utama repo, bukan di dalam folder `Sotrack-v2.1.4-GitHub-Pages`.
5. Klik Commit changes. Gunakan branch `main`.
6. Settings → Pages → Build and deployment → Source: Deploy from a branch.
7. Branch: main, Folder: /(root) → Save.
8. Tunggu proses selesai; buka alamat yang ditampilkan di Settings → Pages. Bentuk umumnya `https://USERNAME.github.io/sotrack/`. Buka dengan garis miring `/` di akhir.
9. Di Chrome Android, izinkan lokasi. Menu browser → Add to Home screen / Install app untuk memasang PWA.

Tidak perlu npm install atau build untuk deploy. Repo boleh punya nama lain; alamat aset dan manifest memakai path relatif. Jika memakai HP, aktifkan Situs desktop jika pengaturan Pages atau tombol Upload files tidak terlihat.

Panduan resmi: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Pindahkan data dari alamat lama

Data tersimpan lokal di browser dan tidak otomatis berpindah saat alamat web berubah.

1. Selesaikan dan simpan aktivitas aktif di Sotrack lama.
2. Dari Pengaturan, ekspor Backup JSON lalu simpan filenya.
3. Buka Sotrack GitHub Pages → Pengaturan → Pulihkan/import backup tersebut. Pemulihan mengganti data lokal pada alamat baru; lakukan sebelum membuat data baru di sana.
4. Periksa daftar aktivitas, rute, peta tersimpan dan pengaturan. Hubungkan ulang sensor serta izinkan lokasi di alamat baru.
5. Hapus pintasan lama hanya setelah data baru sudah dicek.

Riwayat pribadi tidak disertakan dalam ZIP ini. Publikasi GitHub Pages menampilkan app secara publik; penyimpanan aktivitas tetap lokal di perangkat, tanpa sinkronisasi akun/cloud.

## Pemakaian

- Pilih A/B lalu Rute online untuk menghitung dan menyimpan rute. Memilih titik saja belum menghasilkan jalur.
- Pratinjau menampilkan seluruh rute. Mulai gowes membuka navigasi dengan arah perjalanan di atas.
- N: utara di atas; tombol lokasi: kembali mengikuti perjalanan. Tombol POV memilih Utara, Ikuti arah, atau Miring. Miring memerlukan peta Modern/Terang, internet dan perangkat WebGL.
- Rute online baru memakai instruksi BRouter. Rute GPX/gambar lama tanpa instruksi memakai belokan perkiraan dari bentuk jalur.
- ETA memakai kecepatan GPS saat ini; tidak menghitung waktu berhenti, lalu lintas atau pengaruh tanjakan. Saat berhenti/GPS tidak akurat, ETA tidak ditampilkan.
- Buka app online satu kali untuk menyiapkan app shell offline. Unduh area peta sebelum berangkat; cache app saja tidak mengunduh semua jalan.
- GPS merekam saat app aktif. Jangan mengandalkan rekaman saat layar mati atau browser ditutup.
- Bluetooth memerlukan browser yang mendukung Web Bluetooth, misalnya Chrome Android, serta sensor yang menyiarkan layanan BLE yang sesuai. Band yang tersambung ke HP belum tentu menyiarkan HR ke web app.
- Layanan peta/rute/cuaca eksternal memerlukan internet dan bisa mengalami pembatasan. ZIP tidak menyertakan Google Maps API key atau layanan berbayar.

## Update berikutnya

Upload ulang file versi baru ke repo dan commit. Simpan aktivitas sebelum memperbarui app. Jangan menghapus data situs browser karena itu juga menghapus aktivitas lokal. Buat backup berkala.

## Pengembangan / tes

Paket memakai JavaScript module tanpa dependensi build; MapLibre GL disertakan lokal dengan lisensinya. Dengan Node.js 20 atau lebih baru, jalankan `npm test` di folder ini. Tes mencakup GPS, sensor decoder, routing, ETA, kamera peta dan app shell offline. Pemeriksaan perangkat GPS/BLE serta tampilan browser asli belum dilakukan.

GitHub Pages hanya menyajikan file statis. Tidak ada backend, login pengguna, atau penyimpanan server dalam paket ini.

## Replay dan pembaruan peta v2.1.4

Setelah aktivitas disimpan, halaman Aktivitas membuka Replay. Aktivitas lama dapat dibuka melalui Detail → Replay aktivitas. Putar/jeda, ulang, geser timeline dan pilih 1×/10×/30×/60×. Replay menampilkan speed, HR, top speed aktivitas, zona HR, grafik speed/HR dan waktu asli rekaman dalam WIB. Jam di dashboard/navigasi berjalan dalam WIB.

Rekaman baru menyimpan waktu aktif dan speed per titik. Aktivitas lama memakai rekonstruksi GPS; jeda panjang tidak disambung dan HR hilang tidak dibuat-buat. Top speed berasal dari catatan aktivitas/rekaman yang tersedia. Acuan zona menggunakan max HR saat aktivitas direkam, atau pengaturan jika snapshot tidak ada; ini indikator latihan, bukan diagnosis medis.

Rute online sekarang meminta jalur baru saat online. Cache rute hanya dipakai ketika offline dan ditandai sebagai cache. Jalan offline lama tidak lagi ditumpuk di atas tile online. Perbarui area melalui Rute & peta → Perbarui area; jika gagal, salinan lama tetap disimpan. Tanggal salinan ditampilkan. Muat ulang tampilan peta tetap mengikuti cache HTTP penyedia; tidak menjamin seluruh jalan/tempat di OSM langsung sesuai kondisi lapangan.

Google Maps bawaan tetap dapat dibuka lewat tombol Google Maps. Penyematan Google Maps JavaScript API untuk produksi memerlukan API key dan billing; belum diaktifkan di paket ini. Dokumentasi: https://developers.google.com/maps/documentation/javascript/get-api-key . Offline tetap menggunakan data vektor yang disimpan.

Validasi: tes Node, syntax/asset audit, dan smoke test modul UI dengan DOM tiruan. Browser/HP sungguhan serta layanan peta live belum diuji.

## Tampilan v2.1.4

Bar jam memakai layout screenshot yang disetujui, dengan jam HH:mm WIB dan status rata tengah. Peta tetap fokus utama. Panel ringkas, tombol POV, peta Modern/Terang/Klasik, mode siang/malam dan layout landscape tersedia. Info data peta berada dalam menu Peta. Aturan responsif mencakup HP kecil, landscape, tablet dan laptop; belum diuji langsung pada semua perangkat. Peta Modern/Terang menggunakan OpenFreeMap tanpa API key/billing. Saat penyedia gagal, app memakai cadangan klasik atau jalan offline tersimpan.
