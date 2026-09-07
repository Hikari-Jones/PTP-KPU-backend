DROP DATABASE IF EXISTS kpu_db;
CREATE DATABASE kpu_db;
USE kpu_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Master Bagian / Sub-Divisi KPU
CREATE TABLE bagian (
    id_bagian INT AUTO_INCREMENT PRIMARY KEY,
    kode_bagian VARCHAR(20) NOT NULL UNIQUE,
    nama_bagian VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

-- Master Pegawai KPU
CREATE TABLE pegawai (
    id_pegawai INT AUTO_INCREMENT PRIMARY KEY,
    id_bagian INT NULL,
    nama VARCHAR(150) NOT NULL,
    nip VARCHAR(30) NULL,
    jabatan VARCHAR(100) NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'pegawai',
    CONSTRAINT fk_pegawai_bagian FOREIGN KEY (id_bagian) REFERENCES bagian(id_bagian) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Master Kode Klasifikasi Arsip (Berdasarkan Keputusan KPU No. 666 / PKPU Tata Naskah Dinas)
CREATE TABLE kode_klasifikasi_arsip (
    id_klasifikasi INT AUTO_INCREMENT PRIMARY KEY,
    kode_klasifikasi VARCHAR(50) NOT NULL UNIQUE,
    nama_klasifikasi VARCHAR(255) NOT NULL,
    kategori_utama VARCHAR(100) NOT NULL,
    deskripsi TEXT NULL,
    retensi_aktif_tahun INT NOT NULL DEFAULT 2,
    retensi_inaktif_tahun INT NOT NULL DEFAULT 5,
    hak_akses VARCHAR(50) NOT NULL DEFAULT 'Internal'
) ENGINE=InnoDB;

-- Master Jenis Naskah Dinas / Surat
CREATE TABLE jenis_surat (
    id_jenis_surat INT AUTO_INCREMENT PRIMARY KEY,
    kode_jenis VARCHAR(20) NOT NULL UNIQUE,
    nama_jenis VARCHAR(100) NOT NULL,
    format_nomor VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- Sequence Counter Penomoran Surat (Atomic Locking System)
CREATE TABLE penomoran_sequence (
    id_sequence INT AUTO_INCREMENT PRIMARY KEY,
    tahun INT NOT NULL,
    id_jenis_surat INT NOT NULL,
    id_bagian INT NULL,
    last_number INT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_seq_jenis FOREIGN KEY (id_jenis_surat) REFERENCES jenis_surat(id_jenis_surat) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_seq_bagian FOREIGN KEY (id_bagian) REFERENCES bagian(id_bagian) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_seq_rule UNIQUE (tahun, id_jenis_surat, id_bagian)
) ENGINE=InnoDB;

-- Table Utama Surat Keluar
CREATE TABLE surat_keluar (
    id_surat_keluar INT AUTO_INCREMENT PRIMARY KEY,
    id_pegawai INT NOT NULL,
    id_bagian INT NOT NULL,
    id_klasifikasi INT NOT NULL,
    id_jenis_surat INT NOT NULL,
    nomor_surat VARCHAR(150) NULL UNIQUE,
    nomor_urut INT NULL,
    tahun INT NOT NULL,
    bulan_romawi VARCHAR(10) NOT NULL,
    sifat_surat VARCHAR(30) NOT NULL DEFAULT 'Biasa',
    lampiran VARCHAR(100) NULL DEFAULT '-',
    perihal TEXT NOT NULL,
    tujuan_surat TEXT NOT NULL,
    isi_surat LONGTEXT NULL,
    file_surat VARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    tanggal_surat DATE NOT NULL,
    tanggal_terbit DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_suratkeluar_pegawai FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_suratkeluar_bagian FOREIGN KEY (id_bagian) REFERENCES bagian(id_bagian) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_suratkeluar_klasifikasi FOREIGN KEY (id_klasifikasi) REFERENCES kode_klasifikasi_arsip(id_klasifikasi) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_suratkeluar_jenis FOREIGN KEY (id_jenis_surat) REFERENCES jenis_surat(id_jenis_surat) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabel Spesifik Surat Tugas
CREATE TABLE surat_tugas (
    id_surat_tugas INT AUTO_INCREMENT PRIMARY KEY,
    id_surat_keluar INT NOT NULL UNIQUE,
    nomor_tugas VARCHAR(100) NOT NULL,
    maksud_tugas TEXT NOT NULL,
    tempat_tugas VARCHAR(255) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    beban_anggaran VARCHAR(255) NULL DEFAULT 'DIPA KPU Provinsi Sulawesi Utara',
    CONSTRAINT fk_surattugas_suratkeluar FOREIGN KEY (id_surat_keluar) REFERENCES surat_keluar(id_surat_keluar) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabel Junction Pegawai Pelaksana Surat Tugas
CREATE TABLE surat_tugas_pelaksana (
    id_pelaksana INT AUTO_INCREMENT PRIMARY KEY,
    id_surat_tugas INT NOT NULL,
    id_pegawai INT NOT NULL,
    peran_tugas VARCHAR(100) NOT NULL DEFAULT 'Pelaksana',
    CONSTRAINT fk_pelaksana_surattugas FOREIGN KEY (id_surat_tugas) REFERENCES surat_tugas(id_surat_tugas) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pelaksana_pegawai FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabel Riwayat Status / Audit Trail Surat
CREATE TABLE riwayat_status_surat (
    id_riwayat INT AUTO_INCREMENT PRIMARY KEY,
    id_surat_keluar INT NOT NULL,
    id_pegawai INT NOT NULL,
    status_lama VARCHAR(30) NULL,
    status_baru VARCHAR(30) NOT NULL,
    catatan TEXT NULL,
    waktu DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_riwayat_suratkeluar FOREIGN KEY (id_surat_keluar) REFERENCES surat_keluar(id_surat_keluar) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_riwayat_pegawai FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabel Disposisi Surat
CREATE TABLE disposisi (
    id_disposisi INT AUTO_INCREMENT PRIMARY KEY,
    id_surat_keluar INT NOT NULL,
    id_pegawai INT NOT NULL,
    instruksi TEXT NOT NULL,
    tanggal_disposisi DATE NOT NULL,
    CONSTRAINT fk_disposisi_suratkeluar FOREIGN KEY (id_surat_keluar) REFERENCES surat_keluar(id_surat_keluar) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_disposisi_pegawai FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabel Pengarsipan Dokumen Elektronik
CREATE TABLE dokumen_arsip (
    id_arsip INT AUTO_INCREMENT PRIMARY KEY,
    id_surat_keluar INT NULL,
    id_klasifikasi INT NOT NULL,
    id_pegawai INT NOT NULL,
    nama_dokumen VARCHAR(255) NOT NULL,
    nomor_dokumen VARCHAR(150) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    hak_akses VARCHAR(50) NOT NULL DEFAULT 'Internal',
    file_path VARCHAR(255) NULL,
    status_hapus BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_arsip_suratkeluar FOREIGN KEY (id_surat_keluar) REFERENCES surat_keluar(id_surat_keluar) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_arsip_klasifikasi FOREIGN KEY (id_klasifikasi) REFERENCES kode_klasifikasi_arsip(id_klasifikasi) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_arsip_pegawai FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabel Anggaran (Keuangan)
CREATE TABLE akun_anggaran (
    id_akun_anggaran INT AUTO_INCREMENT PRIMARY KEY,
    id_bagian INT NOT NULL,
    kode_akun VARCHAR(50) NOT NULL UNIQUE,
    nama_akun VARCHAR(150) NOT NULL,
    total_pagu DECIMAL(18,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_akun_bagian FOREIGN KEY (id_bagian) REFERENCES bagian(id_bagian) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE realisasi_anggaran (
    id_realisasi INT AUTO_INCREMENT PRIMARY KEY,
    id_akun_anggaran INT NOT NULL,
    tanggal_transaksi DATE NOT NULL,
    nomor_dokumen VARCHAR(100) NOT NULL,
    uraian_kegiatan TEXT NOT NULL,
    jumlah_realisasi DECIMAL(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    CONSTRAINT fk_realisasi_akun FOREIGN KEY (id_akun_anggaran) REFERENCES akun_anggaran(id_akun_anggaran) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabel Chat Session & Message
CREATE TABLE chat_session (
    id_sesi_chat INT AUTO_INCREMENT PRIMARY KEY,
    id_pegawai INT NOT NULL,
    dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_session_pegawai FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE chat_message (
    id_pesan INT AUTO_INCREMENT PRIMARY KEY,
    id_sesi_chat INT NOT NULL,
    role VARCHAR(20) NOT NULL,
    teks LONGTEXT NULL,
    jenis_dokumen VARCHAR(50) NULL,
    lampiran_file VARCHAR(255) NULL,
    CONSTRAINT fk_chat_message_session FOREIGN KEY (id_sesi_chat) REFERENCES chat_session(id_sesi_chat) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Seed Data Awal
INSERT INTO bagian (id_bagian, kode_bagian, nama_bagian) VALUES
(1, 'DATA', 'Subbagian Perencanaan, Data, dan Informasi'),
(2, 'TEKMAS', 'Subbagian Teknis Penyelenggaraan Pemilu dan Hubmas'),
(3, 'HUKUM', 'Subbagian Hukum dan SDM'),
(4, 'KUL', 'Subbagian Keuangan, Umum, dan Logistik');

INSERT INTO jenis_surat (id_jenis_surat, kode_jenis, nama_jenis, format_nomor) VALUES
(1, 'SD', 'Surat Dinas', '{nomor_urut}/{kode_klasifikasi}-SD/71/{bulan_romawi}/{tahun}'),
(2, 'ST', 'Surat Tugas', '{nomor_urut}/{kode_klasifikasi}-ST/71/{bulan_romawi}/{tahun}'),
(3, 'ND', 'Nota Dinas', '{nomor_urut}/ND-{kode_bagian}/71/{bulan_romawi}/{tahun}'),
(4, 'Kpt', 'Keputusan KPU', '{nomor_urut}/{kode_klasifikasi}-Kpt/71/{tahun}'),
(5, 'Und', 'Surat Undangan', '{nomor_urut}/{kode_klasifikasi}-Und/71/{bulan_romawi}/{tahun}');

INSERT INTO kode_klasifikasi_arsip (kode_klasifikasi, nama_klasifikasi, kategori_utama, deskripsi) VALUES
('PL.01.1', 'Penyelenggaraan Pemilu - Perencanaan', 'Penyelenggaraan Pemilu', 'Klasifikasi terkait perencanaan tahapan pemilu/pilkada'),
('PL.02.1', 'Pencalonan dan Data Pemilih', 'Penyelenggaraan Pemilu', 'Klasifikasi pemutakhiran data pemilih dan pencalonan'),
('HR.01.2', 'Kepegawaian - Surat Tugas dan Pelatihan', 'SDM dan Kepegawaian', 'Klasifikasi penugasan dinas dan pengembangan SDM'),
('HK.01.1', 'Hukum dan JDIH - Peraturan dan Keputusan', 'Hukum', 'Klasifikasi produk hukum dan perundang-undangan'),
('KU.01.3', 'Keuangan - DIPA dan Pertanggungjawaban', 'Keuangan', 'Klasifikasi pelaksanaan anggaran dan DIPA'),
('IT.01.1', 'Sistem Informasi dan Infrastruktur IT', 'Data dan Informasi', 'Klasifikasi pengembangan aplikasi, server, dan jaringan KPU');

SET FOREIGN_KEY_CHECKS = 1;
