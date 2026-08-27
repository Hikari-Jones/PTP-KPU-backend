DROP DATABASE IF EXISTS kpu_db;
CREATE DATABASE kpu_db;
USE kpu_db;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE bagian (
    id_bagian INT AUTO_INCREMENT PRIMARY KEY,
    nama_bagian VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE pegawai (
    id_pegawai INT AUTO_INCREMENT PRIMARY KEY,
    id_bagian INT NULL,
    nama VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    CONSTRAINT fk_pegawai_bagian FOREIGN KEY (id_bagian) REFERENCES bagian(id_bagian) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

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

CREATE TABLE surat (
    id_surat INT AUTO_INCREMENT PRIMARY KEY,
    id_pegawai INT NOT NULL,
    jenis_surat VARCHAR(50) NOT NULL,
    nomor_surat VARCHAR(100) NOT NULL UNIQUE,
    tanggal DATE NOT NULL,
    perihal TEXT NOT NULL,
    file_surat VARCHAR(255) NULL,
    CONSTRAINT fk_surat_pegawai FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE disposisi (
    id_disposisi INT AUTO_INCREMENT PRIMARY KEY,
    id_surat INT NOT NULL,
    id_pegawai INT NOT NULL,
    instruksi TEXT NOT NULL,
    tanggal_disposisi DATE NOT NULL,
    CONSTRAINT fk_disposisi_surat FOREIGN KEY (id_surat) REFERENCES surat(id_surat) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_disposisi_pegawai FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dokumen_arsip (
    nama_dokumen VARCHAR(15) PRIMARY KEY,
    nomor_dokumen INT AUTO_INCREMENT UNIQUE,
    id_pegawai INT NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    hak_akses VARCHAR(50) NOT NULL DEFAULT 'internal',
    status_hapus BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_dokumen_pegawai FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

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

SET FOREIGN_KEY_CHECKS = 1;
