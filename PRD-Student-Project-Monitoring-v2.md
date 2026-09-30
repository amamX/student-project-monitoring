# PRODUCT REQUIREMENTS DOCUMENT

## Student Project Monitoring System

*Platform pemantauan progres project mahasiswa untuk dosen dan mahasiswa*

| | |
|---|---|
| **Versi** | 2.0 (Final) |
| **Status** | Disepakati / Ready for Development |
| **Tanggal Revisi** | Hasil pembahasan lanjutan dari draft v1.0 |

---

## 0. Ringkasan Perubahan dari Draft Sebelumnya (v1.0 → v2.0)

*Dokumen ini adalah revisi final dari PRD awal, hasil pembahasan lanjutan. Perubahan utama dirangkum di sini agar mudah dibandingkan.*

| Aspek | Draft v1.0 (awal) | Final v2.0 (setelah dibahas) |
|---|---|---|
| Deadline | Belum ditentukan levelnya | Deadline diatur per mata kuliah, satu deadline untuk semua project di MK itu |
| Keterlambatan | Belum dibahas | Hanya muncul badge "Terlambat"; project tetap bisa diedit bebas, tidak dikunci |
| Progres project | Field status tunggal (belum_mulai/dikerjakan/revisi/selesai) | Sistem 5 tahap berurutan (milestone) + checklist task di dalam tiap tahap, task juga harus berurutan |
| Uncheck task | Belum ada mekanisme | Bebas uncheck kapan saja; uncheck task di tengah akan otomatis meng-uncheck semua task setelahnya (menjaga urutan tetap valid) |
| Review dosen | Bisa terkesan seperti approval yang mengunci progres | Diperjelas: review dosen hanya komentar + label informasi, tidak memblokir atau mereset progres mahasiswa |
| Tahap akhir (Selesai) | Hanya link project | Wajib upload file .zip berisi kode project lengkap (Supabase Storage) + link demo bersifat opsional |
| Dashboard dosen | Hanya daftar project | Ditambah panel analytics ringkasan (total progres kelas, jumlah tim tertinggal, dsb.) serta filter & pencarian |
| Manajemen tim | Sekadar undang anggota | Ditambah aturan keluar tim, mengeluarkan anggota, dan status "tanpa_ketua" jika ketua keluar tanpa pengganti |
| Jumlah project & mata kuliah | Belum dibatasi eksplisit | Dikonfirmasi: mahasiswa boleh punya banyak project tanpa batas; satu dosen boleh mengampu lebih dari satu mata kuliah |

---

## 1. Latar Belakang & Masalah

Saat ini pengumpulan dan pemantauan progres project mahasiswa umumnya dilakukan melalui Google Drive, screenshot, atau grup chat. Pendekatan ini menimbulkan beberapa masalah:

- Dosen kesulitan melacak siapa yang progresnya tertinggal karena data tersebar di banyak file dan percakapan.
- Tidak ada riwayat review/feedback yang terstruktur — mudah hilang di tengah obrolan chat.
- Mahasiswa lain tidak bisa melihat progres rekan sekelas sebagai referensi atau motivasi.
- Tidak ada satu sumber kebenaran (single source of truth) untuk status tiap project per mata kuliah.

Student Project Monitoring System dibangun sebagai platform terpusat: mahasiswa mengelola project mereka sendiri, dan dosen memantau seluruh progres kelas dari satu dashboard.

---

## 2. Tujuan Produk

- Memberi dosen visibilitas penuh atas progres seluruh project mahasiswa per mata kuliah, termasuk siapa yang tertinggal.
- Mempercepat proses review dosen terhadap hasil kerja mahasiswa melalui link dan file yang dibagikan langsung di platform.
- Memungkinkan mahasiswa mengelola project mereka secara mandiri (buat, edit, hapus, checklist progres).
- Menumbuhkan transparansi antar-mahasiswa melalui akses lihat (read-only) ke project mahasiswa lain.
- Mendukung kerja tim melalui fitur undang kolaborator dan manajemen anggota.

---

## 3. Target Pengguna & Roles

| Role | Deskripsi |
|---|---|
| Mahasiswa | Membuat, mengedit, menghapus project miliknya sendiri (atau milik tim jika berperan sebagai ketua/anggota). Bisa melihat project mahasiswa lain secara read-only. Bisa mengundang dan mengelola anggota tim di project yang ia buat. |
| Dosen | Melihat seluruh project & progres dalam mata kuliah yang diampu — boleh mengampu lebih dari satu mata kuliah. Memberi review/komentar pada tiap project. Tidak dapat mengedit isi project mahasiswa. |

*Tidak ada role admin terpisah di MVP. Dosen berperan sebagai pengelola tertinggi untuk mata kuliah yang ia ampu.*

---

## 4. Fitur — Mahasiswa

### 4.1 Autentikasi

- Register & login menggunakan email + password (Supabase Auth).
- Profil dasar: nama lengkap, NIM, email.

### 4.2 Manajemen Project (CRUD)

Mahasiswa dapat membuat project baru tanpa batas jumlah, dengan atribut:

- Judul project
- Deskripsi
- Mata kuliah (wajib dipilih dari daftar yang tersedia)
- Link project (mendukung banyak link — GitHub, Figma, demo, dsb.)
- Progres otomatis dari sistem checklist tahap (lihat bagian 6)

Mahasiswa dapat mengedit dan menghapus project miliknya sendiri, namun tidak bisa mengedit atau menghapus project milik mahasiswa lain.

### 4.3 Melihat Project Lain (Read-only)

- Melihat daftar seluruh project pada mata kuliah yang sama (halaman Explore Project).
- Melihat detail, progres, dan link yang dibagikan mahasiswa lain.
- Tidak dapat mengubah apa pun pada project orang lain.
- Tersedia filter & pencarian: berdasarkan mata kuliah, status, atau nama tim/mahasiswa.

### 4.4 Dashboard Mahasiswa

- Ringkasan seluruh project milik sendiri beserta progres tiap tahap.
- Riwayat komentar/review dari dosen untuk tiap project.

### 4.5 Kolaborasi Tim

Setiap project memiliki satu ketua (pembuat project pertama kali).

- Ketua dapat mengundang mahasiswa lain melalui kode undangan atau pencarian email/NIM.
- Status undangan: `pending`, `diterima`, `ditolak`.
- Anggota yang diterima memiliki akses edit terbatas (checklist task, deskripsi), namun hanya ketua yang bisa menghapus project.
- Ketua dapat mengeluarkan anggota kapan saja; anggota juga dapat keluar dari tim secara mandiri.
- Jika ketua keluar atau dihapus, sistem meminta anggota tersisa memilih ketua baru. Jika tidak ada anggota tersisa, project berstatus `tanpa_ketua` — tetap tampil di dashboard dosen namun tidak dapat diedit sampai ada mahasiswa yang mengklaim menjadi ketua baru.

*Desain ini sengaja dibuat dua level (ketua & anggota) tanpa role granular tambahan, agar tetap sederhana untuk kebutuhan MVP.*

---

## 5. Fitur — Dosen

### 5.1 Dashboard Dosen

- Melihat semua project dari seluruh mata kuliah yang diampu (dosen bisa mengampu lebih dari satu mata kuliah).
- Filter berdasarkan mata kuliah, status progres, atau nama tim/mahasiswa.
- Panel analytics ringkasan: total project per mata kuliah, rata-rata persentase progres kelas, jumlah tim yang tertinggal (stuck di satu tahap terlalu lama atau melewati deadline), serta jumlah tim yang sudah selesai.

### 5.2 Review Project

Review dosen bersifat informasi/komentar, **bukan** approval yang memblokir progres mahasiswa.

- Dosen dapat membuka detail project, link, dan file .zip yang dibagikan mahasiswa.
- Dosen menambahkan komentar dan label opsional (misalnya: `perlu_perbaikan`, `bagus`, `catatan`).
- Dosen dapat mengedit atau menghapus review yang ia buat sendiri.
- Jika dosen memberi catatan bahwa suatu bagian masih kurang, mahasiswa cukup meng-uncheck task terkait secara manual — progres akan otomatis berkurang, tanpa perlu proses approval ulang dari sistem.

### 5.3 Manajemen Mata Kuliah

- Dosen dapat menambahkan mata kuliah yang ia ampu, lengkap dengan deadline mata kuliah tersebut.
- Daftar mata kuliah ini yang akan muncul sebagai pilihan wajib saat mahasiswa membuat project.

---

## 6. Sistem Pelacakan Progres (Milestone & Task)

Progres project dilacak melalui 5 tahap (milestone) tetap yang harus diselesaikan secara berurutan — baik antar-tahap maupun antar-task di dalam satu tahap. Progres (%) dihitung otomatis dari jumlah task yang tercentang dibagi total task keseluruhan.

### 6.1 Tahap 1 — Perencanaan

1. Menentukan judul & deskripsi project
2. Menentukan tujuan / masalah yang ingin diselesaikan
3. Menentukan fitur utama (scope)
4. Menentukan tech stack yang digunakan
5. Membagi tugas anggota tim (jika berkolaborasi)

### 6.2 Tahap 2 — Desain

1. Membuat wireframe / mockup tampilan
2. Menentukan struktur data / database yang dibutuhkan
3. Menentukan alur pengguna (user flow)
4. Review desain bersama tim (jika ada anggota lain)

### 6.3 Tahap 3 — Development

1. Setup project & repository
2. Implementasi fitur-fitur utama
3. Integrasi database
4. Pengujian mandiri oleh pengembang

### 6.4 Tahap 4 — Testing

1. Uji seluruh fitur sesuai rencana awal
2. Perbaikan bug yang ditemukan
3. Uji tampilan pada berbagai ukuran layar (responsive check)

### 6.5 Tahap 5 — Selesai

1. Upload file .zip berisi kode project lengkap (disimpan di Supabase Storage)
2. Tautkan link demo / deploy (opsional)
3. Tulis dokumentasi singkat (README)
4. Project siap direview dosen

### 6.6 Aturan Urutan & Uncheck

- Task pada suatu tahap tidak dapat dibuka sebelum seluruh task di tahap sebelumnya selesai (100%).
- Di dalam satu tahap, task juga wajib dicentang secara berurutan dari atas ke bawah.
- Mahasiswa dapat meng-uncheck task kapan saja tanpa perlu approval dosen.
- Meng-uncheck task di tengah urutan akan otomatis meng-uncheck seluruh task setelahnya, agar urutan progres tetap konsisten dan valid.

---

## 7. Deadline & Keterlambatan

- Deadline diatur pada level mata kuliah oleh dosen — satu deadline berlaku untuk semua project pada mata kuliah tersebut.
- Jika tanggal saat ini melewati deadline dan project belum berstatus "Selesai", sistem menampilkan badge "Terlambat" secara otomatis (dihitung dinamis, bukan status permanen yang mengunci apa pun).
- Project yang berstatus terlambat tetap dapat diedit dan dilanjutkan secara bebas oleh mahasiswa.

---

## 8. Kebutuhan Non-Fungsional

- Desain UI/UX modern dan bersih, mendukung dark/light mode, dengan micro-interaction menggunakan Framer Motion.
- Responsive — nyaman diakses dari desktop maupun mobile.
- Keamanan: Row Level Security (RLS) di Supabase, memastikan mahasiswa hanya bisa mengubah data miliknya sendiri dan dosen hanya bisa mengubah review miliknya sendiri.
- Performa: dashboard dosen tetap responsif walau jumlah project banyak (pagination / lazy load).
- Skalabilitas: struktur data mendukung banyak mata kuliah dan banyak angkatan sekaligus.

---

## 9. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React.js |
| Styling | Tailwind CSS (khusus ini saja) |
| Animasi | Framer Motion |
| Desain intelligence | Skill UI/UX Pro Max (dipasang sebagai skill AI agent) |
| Backend | Node.js + Express.js |
| Database | Supabase (PostgreSQL) |
| Autentikasi | Supabase Auth |
| Penyimpanan file | Supabase Storage (untuk upload .zip kode project) |

*AI agent perlu koneksi langsung ke Supabase (melalui connector/API) agar skema tabel dan data contoh dapat dibuat otomatis, tanpa input manual seperti pada setup MySQL/Laragon.*

---

## 10. Skema Database (PostgreSQL / Supabase)

### 10.1 `users`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | dari Supabase Auth |
| full_name | text | - |
| nim | text | nullable untuk dosen |
| email | text | unique |
| role | text | mahasiswa / dosen |
| created_at | timestamptz | default now() |

### 10.2 `courses` (mata kuliah)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | - |
| name | text | nama mata kuliah |
| code | text | kode MK |
| lecturer_id | uuid (FK → users) | dosen pengampu; satu dosen bisa punya banyak baris course |
| deadline | timestamptz | deadline berlaku untuk semua project di MK ini |

### 10.3 `projects`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | - |
| title | text | - |
| description | text | - |
| course_id | uuid (FK → courses) | wajib dipilih |
| owner_id | uuid (FK → users) | ketua tim; nullable jika status tanpa_ketua |
| team_status | text | aktif / tanpa_ketua |
| created_at | timestamptz | - |
| updated_at | timestamptz | - |

*Status "Terlambat" dan persentase progres **tidak disimpan** sebagai kolom tetap — keduanya dihitung dinamis dari `courses.deadline` dan tabel `project_tasks`.*

### 10.4 `project_links`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | - |
| project_id | uuid (FK) | - |
| label | text | misal "GitHub", "Demo" |
| url | text | - |

### 10.5 `project_files`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | - |
| project_id | uuid (FK) | - |
| file_url | text | path ke Supabase Storage (.zip kode project) |
| uploaded_at | timestamptz | - |

### 10.6 `project_members`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | - |
| project_id | uuid (FK) | - |
| user_id | uuid (FK) | anggota yang diundang |
| role_in_team | text | ketua / anggota |
| invite_status | text | pending / diterima / ditolak |
| joined_at | timestamptz | nullable |

### 10.7 `milestones` (referensi tetap, diisi awal / seed)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | - |
| name | text | Perencanaan / Desain / Development / Testing / Selesai |
| order_index | int | 1–5, menentukan urutan wajib |

### 10.8 `tasks` (template task per milestone, diisi awal / seed)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | - |
| milestone_id | uuid (FK → milestones) | - |
| title | text | nama task, misal "Membuat wireframe" |
| order_index | int | urutan wajib di dalam milestone |

### 10.9 `project_tasks` (status checklist per project)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | - |
| project_id | uuid (FK) | - |
| task_id | uuid (FK → tasks) | - |
| is_checked | boolean | default false |
| checked_at | timestamptz | nullable |

### 10.10 `reviews`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | - |
| project_id | uuid (FK) | - |
| lecturer_id | uuid (FK) | - |
| comment | text | - |
| label | text | perlu_perbaikan / bagus / catatan (opsional, informatif saja) |
| created_at | timestamptz | - |

### 10.11 `activity_log`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | - |
| project_id | uuid (FK) | - |
| user_id | uuid (FK) | pelaku aksi |
| action_type | text | misal "task_checked", "task_unchecked", "review_added", "member_joined" |
| description | text | ringkasan aksi untuk ditampilkan di riwayat |
| created_at | timestamptz | - |

---

## 11. Hak Akses (Ringkasan)

| Aksi | Ketua | Anggota | Mhs. Lain | Dosen |
|---|---|---|---|---|
| Membuat project | ✅ | ❌ | ❌ | ❌ |
| Mengedit project | ✅ | ⚠️ terbatas | ❌ | ❌ |
| Menghapus project | ✅ | ❌ | ❌ | ❌ |
| Melihat project (read) | ✅ | ✅ | ✅ read-only | ✅ |
| Checklist / uncheck task | ✅ | ✅ | ❌ | ❌ |
| Undang / keluarkan anggota | ✅ | ❌ | ❌ | ❌ |
| Keluar dari tim | ❌ (harus serah ketua dulu) | ✅ | – | – |
| Upload file .zip / link | ✅ | ✅ | ❌ | ❌ |
| Membuat / mengedit review | ❌ | ❌ | ❌ | ✅ (miliknya sendiri) |
| Mengatur mata kuliah & deadline | ❌ | ❌ | ❌ | ✅ |

---

## 12. Halaman / Screen Utama

1. **Login / Register**
2. **Dashboard Mahasiswa** — daftar project sendiri beserta progres tiap tahap
3. **Detail Project (Mahasiswa)** — checklist tahap & task, kelola anggota tim, lihat review dosen, upload file akhir
4. **Explore Project** — daftar seluruh project mahasiswa lain per mata kuliah, dengan filter & pencarian (read-only)
5. **Dashboard Dosen** — daftar semua project per mata kuliah, panel analytics ringkasan, filter & pencarian
6. **Detail Project (Dosen)** — melihat link, file .zip, riwayat aktivitas, serta menambah/mengedit review
7. **Manajemen Mata Kuliah (Dosen)** — tambah mata kuliah & atur deadline

---

## 13. Roadmap MVP

### Fase 1 — Core

- Autentikasi mahasiswa & dosen
- CRUD project + pemilihan mata kuliah
- Sistem milestone & checklist task berurutan
- Dashboard dosen dasar (daftar project + review)

### Fase 2 — Kolaborasi & Insight

- Undang, keluarkan, dan kelola anggota tim (termasuk status `tanpa_ketua`)
- Panel analytics ringkasan dosen
- Filter & pencarian di dashboard dan Explore Project
- Riwayat aktivitas (activity log) per project

### Fase 3 — Polish

- Badge "Terlambat" otomatis berdasarkan deadline mata kuliah
- Animasi UI (Framer Motion) & penyempurnaan desain (UI/UX Pro Max)
- Fitur lanjutan (opsional, menunggu kebutuhan): notifikasi in-app, lampiran file tambahan, export laporan progres

---

## 14. Risiko & Pertanyaan Terbuka

- Definisi "tertinggal" di panel analytics perlu parameter pasti (misalnya: belum ada progres baru dalam X hari, atau masih di tahap awal mendekati deadline).
- Ukuran maksimum file .zip yang dapat diupload ke Supabase Storage perlu ditentukan (misalnya batas 50–100 MB).
- Perlu disepakati apakah dosen dapat melihat riwayat aktivitas mentah (`activity_log`) atau hanya ringkasannya saja.

---

## 15. Catatan Implementasi Database

Karena database menggunakan Supabase (PostgreSQL) dan bukan MySQL lokal, seluruh skema pada bagian 10 dapat langsung dieksekusi oleh AI agent ke project Supabase (melalui connector/API) — termasuk pembuatan tabel, relasi, RLS policy, seed data milestone/task default, dan data contoh — tanpa perlu input manual seperti pada setup MySQL/Laragon.
