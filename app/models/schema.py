from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import (
    String, Integer, Date, Numeric, Text, ForeignKey, DateTime, DECIMAL, Boolean, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import LONGTEXT

from app.core.database import Base


class Bagian(Base):
    __tablename__ = "bagian"

    id_bagian: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kode_bagian: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    nama_bagian: Mapped[str] = mapped_column(String(150), nullable=False)

    pegawai: Mapped[List["Pegawai"]] = relationship(back_populates="bagian")
    akun_anggaran: Mapped[List["AkunAnggaran"]] = relationship(back_populates="bagian")
    surat_keluar: Mapped[List["SuratKeluar"]] = relationship(back_populates="bagian")
    sequence: Mapped[List["PenomoranSequence"]] = relationship(back_populates="bagian")


class Pegawai(Base):
    __tablename__ = "pegawai"

    id_pegawai: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_bagian: Mapped[Optional[int]] = mapped_column(ForeignKey("bagian.id_bagian", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    nama: Mapped[str] = mapped_column(String(150), nullable=False)
    nip: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    jabatan: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="pegawai")

    bagian: Mapped[Optional["Bagian"]] = relationship(back_populates="pegawai")
    surat_keluar: Mapped[List["SuratKeluar"]] = relationship(back_populates="pegawai")
    dokumen_arsip: Mapped[List["DokumenArsip"]] = relationship(back_populates="pegawai")
    chat_session: Mapped[List["ChatSession"]] = relationship(back_populates="pegawai")
    disposisi: Mapped[List["Disposisi"]] = relationship(back_populates="pegawai")
    pelaksana_tugas: Mapped[List["SuratTugasPelaksana"]] = relationship(back_populates="pegawai")
    riwayat_status: Mapped[List["RiwayatStatusSurat"]] = relationship(back_populates="pegawai")


class KodeKlasifikasiArsip(Base):
    __tablename__ = "kode_klasifikasi_arsip"

    id_klasifikasi: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kode_klasifikasi: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    nama_klasifikasi: Mapped[str] = mapped_column(String(255), nullable=False)
    kategori_utama: Mapped[str] = mapped_column(String(100), nullable=False)
    deskripsi: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retensi_aktif_tahun: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    retensi_inaktif_tahun: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    hak_akses: Mapped[str] = mapped_column(String(50), nullable=False, default="Internal")

    surat_keluar: Mapped[List["SuratKeluar"]] = relationship(back_populates="klasifikasi")
    dokumen_arsip: Mapped[List["DokumenArsip"]] = relationship(back_populates="klasifikasi")


class JenisSurat(Base):
    __tablename__ = "jenis_surat"

    id_jenis_surat: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kode_jenis: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    nama_jenis: Mapped[str] = mapped_column(String(100), nullable=False)
    format_nomor: Mapped[str] = mapped_column(String(255), nullable=False)

    surat_keluar: Mapped[List["SuratKeluar"]] = relationship(back_populates="jenis_surat")
    sequence: Mapped[List["PenomoranSequence"]] = relationship(back_populates="jenis_surat")


class PenomoranSequence(Base):
    __tablename__ = "penomoran_sequence"
    __table_args__ = (
        UniqueConstraint("tahun", "id_jenis_surat", "id_bagian", name="uq_seq_rule"),
    )

    id_sequence: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tahun: Mapped[int] = mapped_column(Integer, nullable=False)
    id_jenis_surat: Mapped[int] = mapped_column(ForeignKey("jenis_surat.id_jenis_surat", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    id_bagian: Mapped[Optional[int]] = mapped_column(ForeignKey("bagian.id_bagian", onupdate="CASCADE", ondelete="CASCADE"), nullable=True)
    last_number: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    jenis_surat: Mapped["JenisSurat"] = relationship(back_populates="sequence")
    bagian: Mapped[Optional["Bagian"]] = relationship(back_populates="sequence")


class SuratKeluar(Base):
    __tablename__ = "surat_keluar"

    id_surat_keluar: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_pegawai: Mapped[int] = mapped_column(ForeignKey("pegawai.id_pegawai", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    id_bagian: Mapped[int] = mapped_column(ForeignKey("bagian.id_bagian", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    id_klasifikasi: Mapped[int] = mapped_column(ForeignKey("kode_klasifikasi_arsip.id_klasifikasi", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    id_jenis_surat: Mapped[int] = mapped_column(ForeignKey("jenis_surat.id_jenis_surat", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    
    nomor_surat: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, unique=True)
    nomor_urut: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tahun: Mapped[int] = mapped_column(Integer, nullable=False)
    bulan_romawi: Mapped[str] = mapped_column(String(10), nullable=False)
    sifat_surat: Mapped[str] = mapped_column(String(30), nullable=False, default="Biasa")
    lampiran: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="-")
    perihal: Mapped[str] = mapped_column(Text, nullable=False)
    tujuan_surat: Mapped[str] = mapped_column(Text, nullable=False)
    isi_surat: Mapped[Optional[str]] = mapped_column(Text().with_variant(LONGTEXT, 'mysql'), nullable=True)
    file_surat: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="draft")
    tanggal_surat: Mapped[date] = mapped_column(Date, nullable=False)
    tanggal_terbit: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    pegawai: Mapped["Pegawai"] = relationship(back_populates="surat_keluar")
    bagian: Mapped["Bagian"] = relationship(back_populates="surat_keluar")
    klasifikasi: Mapped["KodeKlasifikasiArsip"] = relationship(back_populates="surat_keluar")
    jenis_surat: Mapped["JenisSurat"] = relationship(back_populates="surat_keluar")
    
    surat_tugas: Mapped[Optional["SuratTugas"]] = relationship(back_populates="surat_keluar", uselist=False, cascade="all, delete-orphan")
    disposisi: Mapped[List["Disposisi"]] = relationship(back_populates="surat_keluar", cascade="all, delete-orphan")
    dokumen_arsip: Mapped[List["DokumenArsip"]] = relationship(back_populates="surat_keluar")
    riwayat_status: Mapped[List["RiwayatStatusSurat"]] = relationship(back_populates="surat_keluar", cascade="all, delete-orphan")


class SuratTugas(Base):
    __tablename__ = "surat_tugas"

    id_surat_tugas: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_surat_keluar: Mapped[int] = mapped_column(ForeignKey("surat_keluar.id_surat_keluar", onupdate="CASCADE", ondelete="CASCADE"), nullable=False, unique=True)
    nomor_tugas: Mapped[str] = mapped_column(String(100), nullable=False)
    maksud_tugas: Mapped[str] = mapped_column(Text, nullable=False)
    tempat_tugas: Mapped[str] = mapped_column(String(255), nullable=False)
    tanggal_mulai: Mapped[date] = mapped_column(Date, nullable=False)
    tanggal_selesai: Mapped[date] = mapped_column(Date, nullable=False)
    beban_anggaran: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="DIPA KPU Provinsi Sulawesi Utara")

    surat_keluar: Mapped["SuratKeluar"] = relationship(back_populates="surat_tugas")
    pelaksana: Mapped[List["SuratTugasPelaksana"]] = relationship(back_populates="surat_tugas", cascade="all, delete-orphan")


class SuratTugasPelaksana(Base):
    __tablename__ = "surat_tugas_pelaksana"

    id_pelaksana: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_surat_tugas: Mapped[int] = mapped_column(ForeignKey("surat_tugas.id_surat_tugas", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    id_pegawai: Mapped[int] = mapped_column(ForeignKey("pegawai.id_pegawai", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    peran_tugas: Mapped[str] = mapped_column(String(100), nullable=False, default="Pelaksana")

    surat_tugas: Mapped["SuratTugas"] = relationship(back_populates="pelaksana")
    pegawai: Mapped["Pegawai"] = relationship(back_populates="pelaksana_tugas")


class RiwayatStatusSurat(Base):
    __tablename__ = "riwayat_status_surat"

    id_riwayat: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_surat_keluar: Mapped[int] = mapped_column(ForeignKey("surat_keluar.id_surat_keluar", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    id_pegawai: Mapped[int] = mapped_column(ForeignKey("pegawai.id_pegawai", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    status_lama: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    status_baru: Mapped[str] = mapped_column(String(30), nullable=False)
    catatan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    waktu: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())

    surat_keluar: Mapped["SuratKeluar"] = relationship(back_populates="riwayat_status")
    pegawai: Mapped["Pegawai"] = relationship(back_populates="riwayat_status")


class Disposisi(Base):
    __tablename__ = "disposisi"

    id_disposisi: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_surat_keluar: Mapped[int] = mapped_column(ForeignKey("surat_keluar.id_surat_keluar", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    id_pegawai: Mapped[int] = mapped_column(ForeignKey("pegawai.id_pegawai", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    instruksi: Mapped[str] = mapped_column(Text, nullable=False)
    tanggal_disposisi: Mapped[date] = mapped_column(Date, nullable=False)

    surat_keluar: Mapped["SuratKeluar"] = relationship(back_populates="disposisi")
    pegawai: Mapped["Pegawai"] = relationship(back_populates="disposisi")


class DokumenArsip(Base):
    __tablename__ = "dokumen_arsip"

    id_arsip: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_surat_keluar: Mapped[Optional[int]] = mapped_column(ForeignKey("surat_keluar.id_surat_keluar", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    id_klasifikasi: Mapped[int] = mapped_column(ForeignKey("kode_klasifikasi_arsip.id_klasifikasi", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    id_pegawai: Mapped[int] = mapped_column(ForeignKey("pegawai.id_pegawai", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    nama_dokumen: Mapped[str] = mapped_column(String(255), nullable=False)
    nomor_dokumen: Mapped[str] = mapped_column(String(150), nullable=False)
    kategori: Mapped[str] = mapped_column(String(100), nullable=False)
    hak_akses: Mapped[str] = mapped_column(String(50), nullable=False, default="Internal")
    file_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status_hapus: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())

    surat_keluar: Mapped[Optional["SuratKeluar"]] = relationship(back_populates="dokumen_arsip")
    klasifikasi: Mapped["KodeKlasifikasiArsip"] = relationship(back_populates="dokumen_arsip")
    pegawai: Mapped["Pegawai"] = relationship(back_populates="dokumen_arsip")


class AkunAnggaran(Base):
    __tablename__ = "akun_anggaran"

    id_akun_anggaran: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_bagian: Mapped[int] = mapped_column(ForeignKey("bagian.id_bagian", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    kode_akun: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    nama_akun: Mapped[str] = mapped_column(String(150), nullable=False)
    total_pagu: Mapped[Decimal] = mapped_column(DECIMAL(18, 2), nullable=False, default=0)

    bagian: Mapped["Bagian"] = relationship(back_populates="akun_anggaran")
    realisasi_anggaran: Mapped[List["RealisasiAnggaran"]] = relationship(back_populates="akun_anggaran")


class RealisasiAnggaran(Base):
    __tablename__ = "realisasi_anggaran"

    id_realisasi: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_akun_anggaran: Mapped[int] = mapped_column(ForeignKey("akun_anggaran.id_akun_anggaran", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    tanggal_transaksi: Mapped[date] = mapped_column(Date, nullable=False)
    nomor_dokumen: Mapped[str] = mapped_column(String(100), nullable=False)
    uraian_kegiatan: Mapped[str] = mapped_column(Text, nullable=False)
    jumlah_realisasi: Mapped[Decimal] = mapped_column(DECIMAL(18, 2), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")

    akun_anggaran: Mapped["AkunAnggaran"] = relationship(back_populates="realisasi_anggaran")


class ChatSession(Base):
    __tablename__ = "chat_session"

    id_sesi_chat: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_pegawai: Mapped[int] = mapped_column(ForeignKey("pegawai.id_pegawai", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    dibuat_pada: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())

    pegawai: Mapped["Pegawai"] = relationship(back_populates="chat_session")
    messages: Mapped[List["ChatMessage"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_message"

    id_pesan: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_sesi_chat: Mapped[int] = mapped_column(ForeignKey("chat_session.id_sesi_chat", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    teks: Mapped[Optional[str]] = mapped_column(Text().with_variant(LONGTEXT, 'mysql'), nullable=True)
    jenis_dokumen: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    lampiran_file: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    session: Mapped["ChatSession"] = relationship(back_populates="messages")
