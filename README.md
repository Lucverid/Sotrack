# Sotrack Android Beta 0.1.10

APK Android minimum Android 4.4 (API 19), dengan dukungan percobaan WebView KitKat / Chromium 30, untuk pengujian di J2 Prime dan Infinix. Tampilan Sotrack v2.1.12 disimpan di dalam APK dan dibuka memakai Android System WebView. Chrome/Opera tidak perlu dipasang. GPS dan scan/pembacaan HR menggunakan API Android native, bukan Web Bluetooth.

## Instal dan pakai
1. Buka Sotrack-Android-v0.1.10-beta.apk di HP dan instal. Jika diminta, berikan izin pemasangan untuk aplikasi yang membuka APK.
2. Buka Sotrack Beta. Izinkan Lokasi, pilih lokasi presisi jika tersedia, lalu nyalakan GPS/Lokasi HP.
3. Untuk HR: aktifkan Bluetooth HP dan fitur siaran/broadcast HR pada band. Buka Sensor → Hubungkan HR. Izinkan Bluetooth/Perangkat di sekitar jika diminta. Daftar perangkat Android muncul; pilih band/sensor.
4. Jika daftar kosong, aktifkan Cari semua perangkat BLE pada halaman Sensor, lalu pindai lagi. Pada Android 6–11, lokasi HP dan izin lokasi diperlukan untuk scan.
5. Pilih rute dan Mulai. Gunakan dengan layar menyala. Peta mengikuti posisi dan arah; setelah digeser, mode ikuti kembali otomatis setelah 5 detik.
6. Sebelum offline, simpan area peta/rute atau impor GPX dan peta JSON. File aplikasi tersedia tanpa internet; data jalan online tetap memerlukan koneksi.

## Data lama
Data browser dan APK terpisah. Backup JSON dari web app, lalu pulihkan di APK melalui Pengaturan. Data APK disimpan di penyimpanan WebView milik aplikasi. Menghapus aplikasi dapat menghapus data; gunakan backup JSON. GPX/CSV/JSON diekspor melalui pemilih lokasi simpan Android; impor menggunakan pemilih dokumen Android.

## Batas beta
- Belum diuji pada HP fisik, termasuk J2 Prime dan Huawei Band 10. Pemindaian dan koneksi belum bisa dijamin sebelum pengujian perangkat.
- Sensor HR harus menyediakan layanan BLE Heart Rate standar 180D / karakteristik 2A37. Hubungan/protokol khusus Huawei Health tidak diimplementasikan. Sensor cadence dan power native belum tersedia.
- GPS/HR digunakan saat app aktif. Layar mati, background, pemulihan setelah proses dibunuh, dan rekaman latar belakang belum dijamin. Tidak ada foreground recording service pada beta ini.
- Ekspor video replay belum diaktifkan di APK beta. Replay di layar, grafik dan ekspor data GPX/CSV/JSON tetap tersedia.
- Web bundle ditranspilasi untuk Chrome/WebView 30 dan diberi fallback API/layout lama. Semua versi Android System WebView belum diuji. Perangkat sangat lama masih dapat memiliki batas rendering.
- Peta Modern/WebGL tergantung WebView/perangkat/internet. Klasik diprioritaskan untuk perangkat kecil. File APK lokal tidak mengambil sertifikat GitHub untuk memuat app; koneksi eksternal tetap memvalidasi sertifikat dan tidak melewati peringatan SSL.
- Build target API 32 untuk beta pengujian, compile API 35. Bukan paket publikasi Google Play saat ini.

## Validasi yang dilakukan
- Java dikompilasi terhadap Android SDK 35, bytecode DEX minimum API 19.
- 7 cek parser paket HR (8-bit, 16-bit, contact, paket tidak lengkap).
- 6 tes bridge: GPS watch/clear, one-shot, error, WebView geolocation terkunci, transisi online/offline, dan respons/error cuaca native.
- Bundle web berhasil dibuat dan pemeriksaan sintaks JavaScript lolos.
- APK ZIP CRC, manifest/minSdk/launch activity, alignment dan tanda tangan v1/v2/v3 diverifikasi.
- Tidak ada emulator atau perangkat Android fisik yang dipakai untuk pengujian runtime.

## Build ulang
APK dapat dibangun tanpa Gradle menggunakan Python 3 dan Java 17 dengan modul jdk.compiler/jdk.jartool serta Android SDK platform 35 dan build-tools 35:

    python3 build-apk.py --sdk /absolute/path/android-sdk --out /absolute/path/Sotrack.apk

Aset app.bundle.js yang sudah siap tersedia di app/src/main/assets/www. Untuk mengubah UI: jalankan npm install di direktori ini, ubah web-source/, lalu npm run prepare-web dan bangun ulang APK. Gradle/Android Studio configuration disertakan sebagai alternatif; build Gradle belum diuji pada sesi ini.

Pada checkout pembuat APK, folder signing/ menyimpan kunci pengembangan beta; gunakan kunci yang sama untuk pembaruan APK beta. ZIP sumber tidak menyertakan kunci privat. Build dari ZIP tanpa kunci asli menghasilkan tanda tangan berbeda dan tidak dapat menimpa APK yang dibagikan di sini. Jangan publikasikan folder signing/. Untuk distribusi produksi buat kunci rilis terpisah dan proses rilis yang sesuai.

Sumber web: Sotrack v2.1.12. MapLibre BSD-3-Clause disertakan di assets/www/vendor/LICENSE-MapLibre.txt. Peta © OpenStreetMap contributors / OpenFreeMap; atribusi tetap ada di peta.

## Perubahan 0.1.8
- Jalur GPS eksplisit native, tidak bergantung penggantian Navigator.geolocation WebView. GPS/network diminta terpisah agar kegagalan satu penyedia tidak membatalkan lainnya. Hanya cache posisi berumur maksimal 15 detik digunakan; pesan menunggu sinyal ditampilkan.
- Online/offline dibaca dari ConnectivityManager. Android 6+ memakai validasi internet; Android 5 memakai status jaringan tersambung, sehingga belum membuktikan akses internet sebenarnya.
- Ikon kontrol memakai SVG lokal, termasuk teks tombol dinamis.
- Cuaca Open-Meteo lewat HTTPS native, pemeriksaan sertifikat tetap aktif; cache diberi keterangan jika pembaruan gagal. Masalah sertifikat sistem lama masih bisa menghalangi cuaca.
- Min SDK diturunkan ke 21 dan koneksi BLE diberi jalur API 21/22. WebView minimum 49; instal pada Android 5 tidak menjamin WebView bawaan yang belum diperbarui dapat menjalankan UI.
- Install menimpa beta sebelumnya (package dan sertifikat sama), tanpa menghapus aplikasi. HR telah dilaporkan berfungsi oleh pengguna pada J2 Prime; perubahan GPS/cuaca belum diuji pada HP tersebut.

Untuk uji GPS: pilih mode Lokasi Akurasi tinggi, buka speedometer GPS/tombol posisi di ruang terbuka dan tunggu beberapa menit. Untuk uji offline: matikan data dan Wi-Fi, tunggu status berubah, lalu buka kembali koneksi dan coba Perbarui cuaca.

## Hotfix 0.1.8 — ikon dan GPS peta
- Menghapus penggantian ikon asinkron melalui MutationObserver. Kontrol dinamis menulis SVG langsung hanya saat label berubah, sehingga tidak berkedip antara font dan SVG.
- Ikon seluruh rute berbeda dengan layar penuh.
- Peta penuh memegang langganan GPS sendiri saat pratinjau maupun jeda. Posisi tetap diperbarui tanpa menambah titik aktivitas selama jeda. Saat rekaman aktif, callback peta tidak memproses posisi untuk kedua kalinya. Langganan peta dilepas saat keluar dari peta penuh.
- Tombol Cek GPS saat belum ada posisi menampilkan izin, penyedia aktif, status pencarian dan waktu penerimaan posisi dari Android.
- 8 tes JavaScript lolos, termasuk ikon stabil dan GPS peta saat jeda. Build serta tanda tangan APK diverifikasi; belum ada pengujian perangkat fisik untuk hotfix ini.

## Perubahan 0.1.8 — tampilan responsif
- Sesuai koreksi pengguna: tombol kelima / layar penuh di sisi peta dihapus. Tombol keempat # / seluruh rute tetap tersedia.
- Status peta offline diletakkan di luar kanvas, agar posisi GPS tidak tertutup, dengan tombol Siapkan peta menuju unduhan area.
- Status peta dibedakan antara area offline belum tersimpan dan peta online belum termuat.
- Panel awal/tujuan satu kolom pada lebar <=380px; tipografi, ukuran ikon, tombol, navigasi bawah, status koordinat dan panel peta penuh dirapikan. Fallback jarak flex disediakan untuk WebView lama.
- Pesan rute offline tanpa jaringan jalan memberi langkah berikutnya dan membuka pengaturan peta, tanpa istilah topologi.
- 8 tes JavaScript, sintaks bundle, dan pemeriksaan struktur HTML lolos. Tanda tangan APK sama dengan versi sebelumnya. Pemeriksaan visual otomatis terhalang unduhan browser yang tidak lengkap; belum diuji langsung pada perangkat fisik.

## Perubahan 0.1.8 — impor Directions Google Maps
- Rute & peta → Impor Google Maps: tempel link → Baca link → periksa dan pilih lokasi semua titik → Hitung & simpan rute sepeda.
- Membaca parameter resmi origin/destination/waypoints, link /maps/dir/ dengan nama/koordinat, dan format saddr/daddr. Maksimum 9 titik singgah. Titik viewport @lat,lon bukan titik rute.
- Nama tempat dicari dengan Photon yang sudah dikonfigurasi, pengguna wajib memilih kandidat. Awal yang kosong/My location memakai posisi GPS segar atau meminta GPS.
- Link pendek maps.app.goo.gl dan goo.gl/maps dapat dibuka lewat redirect HTTPS native, maksimal 6 hop, timeout terbatas, hanya host Google Maps yang diizinkan. Halaman consent, tautan tempat tanpa Directions, atau redirect nonstandar mungkin tidak didukung: buka di browser dan salin link Directions lengkap. Tidak mengambil HTML/polylines internal Google.
- ACTION_SEND text/plain: Google Maps → Bagikan → Sotrack Beta mengisi formulir, tanpa otomatis mencari/menyimpan. Satu instance Activity dipakai agar share tidak membuka rekaman kedua.
- Semua titik dihitung ulang oleh BRouter sesuai profil sepeda. Ini impor titik Directions, bukan ekspor geometri jalur Google; jalur bisa berbeda. Rute tersimpan bisa diekspor GPX dan dipakai offline; peta jalan area tetap disiapkan terpisah.
- Tidak memerlukan Google Maps API key / billing. Layanan publik Photon/BRouter tetap memiliki ketersediaan dan batas pemakaian masing-masing.
- 17 tes JavaScript lolos (parser URL, urutan titik, koordinat salah, domain palsu, bridge native, GPS dan UI), serta cek Java allowlist/redirect. APK dibangun dan tanda tangan diverifikasi. Belum diuji end-to-end pada HP fisik atau tautan pendek nyata milik pengguna.

## Perubahan 0.1.8 — convert ke file GPX
- Google Maps ke GPX → Baca link → periksa semua titik → Convert & unduh GPX. Hasil rute juga otomatis tersimpan di Sotrack; pemilih lokasi simpan Android dibuka untuk file GPX.
- GPX berisi seluruh geometri hasil perhitungan BRouter, bukan garis lurus awal–tujuan. Nama rute dan elevasi yang tersedia ikut diekspor. Jalur tetap dapat berbeda dari Directions asli Google.
- Hasil konversi digunakan ulang selama formulir/sesi masih terbuka, sehingga unduh GPX lagi tidak menghitung ulang atau menyimpan duplikat rute. Setelah aplikasi ditutup, file GPX juga bisa diekspor dari daftar rute tersimpan.
- Tombol Jadikan rute Sotrack tetap tersedia jika hanya perlu rute di aplikasi.
- 18 tes JavaScript lolos, termasuk isi GPX, escaping nama, geometri jalur, MIME dan unduh ulang offline. APK dibangun dan tanda tangan sama dengan beta sebelumnya. Belum diuji end-to-end pada HP fisik.

## Perubahan 0.1.8 — satu tombol, jalur asli Google
- Menggantikan konversi BRouter pada fitur Google Maps ke GPX. Form hanya berisi link dan tombol Convert ke GPX. Tidak ada nama rute, profil sepeda, pilih lokasi, atau tombol tambahan.
- Mengunduh halaman Directions Google, mengikuti tautan data Directions yang disediakan halaman tersebut, lalu membaca geometri dan indeks rute terpilih. Transportasi dipertahankan, termasuk motor pada contoh pengguna. Tidak melakukan geocoding Photon atau routing BRouter di fitur ini.
- Validasi struktur, moda, indeks rute, rentang koordinat, jumlah titik, kecocokan panjang geometri, serta jarak akses dari pin awal/tujuan. Format tidak dikenal, jaringan/sertifikat gagal, atau data tidak konsisten akan menghentikan konversi, tanpa mengganti jalur secara diam-diam. Format internal Google dapat berubah; tidak semua link dijamin didukung.
- GPX menyimpan pin awal/tujuan asli sebagai wpt bertipe sotrack-start dan sotrack-destination. Track tetap mengikuti akses jalan dari Google: pin tempat dan ujung akses jalan dapat berbeda beberapa meter. Impor/ekspor ulang GPX Sotrack mempertahankan kedua pin itu; tidak menyisipkan garis penghubung buatan ke track.
- Hasil otomatis disimpan sebagai rute aktif dan file GPX disiapkan melalui pemilih penyimpanan Android. Link yang sama dapat diunduh ulang dalam sesi tanpa koneksi dan tanpa duplikat rute.
- Contoh link pengguna berhasil dibaca: moda Motor, 21.252 m menurut respons Google, 1.004 titik track; panjang geometri 21.251 m. GPX XML diperiksa dengan 1.004 trkpt dan dua pin asli. Tidak memasukkan data rute pribadi pengguna ke ZIP sumber ini.
- 21 tes JavaScript dan cek ekstraksi dokumen/allowlist Java lolos. Pengambilan data nyata berhasil dengan HTTP Python; uji live Java pada host terhalang DNS lingkungan. APK Android fisik dan layanan Google pada Android lama belum diuji.
- Jangan menjanjikan jalur selalu identik dengan tangkapan lama: Google dapat memperbarui pilihan rute/traffic. Konversi mempertahankan geometri rute terpilih yang dikirim Google saat konversi.

## Perubahan 0.1.8 — pilih penggunaan rute
- Kolom link satu baris setinggi 44px menggantikan textarea tiga baris. Panel, jarak, warna, tipografi dan dua tombol dirapikan, dengan fallback jarak untuk WebView lama.
- Jadikan rute: membaca geometri Google bila belum tersedia, menyimpan dan mengaktifkan rute di Sotrack tanpa mengunduh file.
- Download GPX: menyiapkan file GPX saja, tanpa menyimpan atau mengganti rute aktif. File dapat diimpor kembali saat offline.
- Hasil pembacaan link digunakan ulang dalam sesi. Menggunakan rute yang sama berulang tidak membuat duplikat, dan pilihan lain tidak memicu permintaan ulang.
- Kedua pilihan perlu internet saat membaca link baru. Jalur tersimpan dapat dipakai offline; gambar jalan memerlukan area peta yang disimpan terpisah.
- 22 tes JavaScript lolos, termasuk pemisahan aksi rute/download dan penggunaan geometri cache saat offline. APK dibangun dan tanda tangan beta diverifikasi. Belum diuji langsung pada HP fisik untuk revisi ini.

## Perubahan 0.1.8 — peta jalan offline otomatis
- Peta offline otomatis aktif secara default; dapat dimatikan di Rute & peta. Saat memilih/mengimpor rute atau mengunduh GPX Google, aplikasi menyiapkan data jalan sekitar jalurnya saat online. Tanpa rute, menyiapkan sekitar lokasi/pusat peta.
- Menggunakan data jalan Overpass/OSM untuk renderer lokal, bukan mengunduh massal raster tile.openstreetmap.org. Query radius 700 m sepanjang potongan garis rute, dengan cakupan aman 600 m dan penyederhanaan hanya untuk query peta. Geometri rute navigasi tidak diubah. Tidak termasuk satelit atau bangunan/visual lengkap peta online.
- Permintaan berjalan berurutan, sekitar 6 km per potongan, maksimal 24 potongan per putaran dan 100 area tersimpan. Bagian berikutnya dilanjutkan dengan tombol Lanjutkan persiapan jika rute panjang. Tidak menghapus area lama secara otomatis.
- Bagian yang selesai disimpan langsung ke IndexedDB; offline/restart tidak menghapusnya. Saat online kembali, bagian yang sudah mencakup jalur dilewati. Status hanya menyebut siap setelah bagian yang direncanakan tersimpan; kegagalan/parsial terlihat jelas.
- Renderer otomatis memakai jalan tersimpan saat offline; peta modern dilepas oleh fallback jaringan. Saat dibuka kembali, viewport diarahkan ke rute aktif atau area tersimpan, agar tidak tampak kosong karena pusat peta default.
- Cakupan koridor diperiksa terhadap garis, bukan hanya kotak pembatas. Backup/restore mempertahankan metadata koridor. Pengaturan lain dipertahankan saat form pengaturan disimpan.
- APK menggunakan permintaan HTTPS native untuk endpoint Overpass default, termasuk pembatalan saat koneksi putus. Endpoint khusus tetap memakai fetch. Sertifikat HTTPS tetap diperiksa.
- 31 tes JavaScript lolos, meliputi persiapan otomatis, pembukaan ulang dengan data tersimpan, reconnect, toggle, geometri/cakupan, dan bridge native beserta pembatalan. APK dibangun dengan sertifikat beta yang sama. Uji unduhan nyata dari host mendapat HTTP 406; unduhan dan rendering di Android fisik belum diuji.
- Penggunaan: tetap online setelah memilih rute, buka Rute & peta → Peta offline otomatis dan tunggu status siap. Setelah itu matikan data; jalan lokal dan jalur/GPS tetap tampil pada area tersimpan. Area baru yang belum disiapkan tetap perlu internet.

## Perubahan 0.1.9 — unduhan peta
- Satu proses unduhan untuk otomatis, sekitar peta, dan sepanjang rute. Tidak ada unduhan manual yang bersaing dengan otomatis. Manual bekerja meskipun otomatis dimatikan.
- Query jalan memakai kotak kecil, bukan pencarian sekitar garis panjang. HTTP 504/timeout mencoba server cadangan Private.coffee, lalu membagi area satu tingkat jika kedua server gagal. Retry terbatas dan diberi jeda, tanpa loop tanpa batas. HTTP status diteruskan dari HTTPS Android native. Sertifikat tetap diverifikasi.
- Setiap bagian berhasil langsung disimpan. Bagian lengkap dipakai kembali; kegagalan tidak ditandai selesai. Tombol Lanjutkan tersedia. Tombol Jeda menghentikan proses.
- Sekitar peta menyimpan kotak 2/4/8 km pada pusat peta yang dipilih; sepanjang rute menyimpan area jalan sekitar seluruh jalur rute aktif secara bertahap. Keduanya perlu internet saat mengunduh dan dapat ditampilkan offline setelah tersimpan.
- Default area 2×2 km. Pilihan manual dibagi dua kartu dengan penjelasan singkat. Peta offline berupa jaringan jalan OSM, bukan salinan tile Google Maps.
- Belum diuji di HP fisik. Ketersediaan server publik dan sertifikat HP tetap dapat menghalangi unduhan; pesan tidak mengklaim selesai jika gagal.

## Perubahan 0.1.10 — Android lama (percobaan)
- Minimum Android 4.4 / API 19. J2 Prime umumnya Android 6.0.1, bukan KitKat. Satu APK tetap dapat memperbarui versi sebelumnya dengan package/kunci yang sama.
- Bundle app ditranspilasi ke ES5 / Chromium 30. Core-js dan fetch polyfill dimuat sebelum bridge. Event/CustomEvent/MouseEvent, traversal DOM, touch pointer, impor file lewat pemilih dokumen native tersedia sebagai fallback.
- Impor KitKat dibatasi 20 MB untuk mengurangi lonjakan memori. Ekspor tetap memakai pemilih dokumen Android.
- Scan HR KitKat memakai BLE API lama; Android 5+ tetap memakai pemindai modern, dipisah agar kelas API baru tidak perlu dimuat di KitKat. HR membutuhkan hardware BLE dan sensor dengan broadcast standar.
- Tema Holo tersedia pada API 19, Material dipertahankan mulai API 21. CSS diberi fallback warna, prefiks flexbox dan susunan kartu layar kecil. KitKat memakai tema gelap dan peta Klasik; animasi dimatikan untuk mengurangi beban.
- Koneksi native KitKat mengaktifkan TLS 1.2 yang didukung perangkat. Pemeriksaan sertifikat/hostname tetap aktif; ini tidak memperbaiki sertifikat akar sistem yang sudah usang. Download peta, cuaca, atau Google Maps masih bisa ditolak sistem/server.
- Tes meliputi sintaks ES5, startup tanpa Promise/Map/URL bawaan, impor GPX lewat bridge KitKat, serta regresi GPS/HR/network/UI/rute/offline. APK dikompilasi dan tanda tangan diverifikasi. Tidak ada pengujian emulator Android 4.4 atau HP KitKat fisik; dukungan ini masih percobaan.
- Sumber hand-written Android sekarang di native-assets/. prepare-web.mjs menyalinnya ke assets/www, lalu menyiapkan bundle dan CSS. Jangan mengedit hasil generated di assets/www untuk perubahan UI berikutnya.

Polyfill: core-js dan whatwg-fetch (MIT), lisensi disertakan di assets/www/vendor/. CSS dibangun memakai PostCSS dan Autoprefixer.
