from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import (
    String, Integer, Date, Numeric, Text, ForeignKey, DateTime, DECIMAL, Boolean
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import LONGTEXT

from app.core.database import Base

class Bagian(Base):
    __tablename__ = "bagian"

    id_bagian: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nama_bagian: Mapped[str] = mapped_column(String(150), nullable=False)

    pegawai: Mapped[List["Pegawai"]] = relationship(back_populates="bagian")
    akun_anggaran: Mapped[List["AkunAnggaran"]] = relationship(back_populates="bagian")


class Pegawai(Base):
    __tablename__ = "pegawai"

    id_pegawai: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_bagian: Mapped[Optional[int]] = mapped_column(ForeignKey("bagian.id_bagian", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    nama: Mapped[str] = mapped_column(String(150), nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)

    bagian: Mapped[Optional["Bagian"]] = relationship(back_populates="pegawai")
    surat: Mapped[List["Surat"]] = relationship(back_populates="pegawai")
    dokumen_arsip: Mapped[List["DokumenArsip"]] = relationship(back_populates="pegawai")
    chat_session: Mapped[List["ChatSession"]] = relationship(back_populates="pegawai")
    disposisi: Mapped[List["Disposisi"]] = relationship(back_populates="pegawai")


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
    status: Mapped[str] = mapped_column(String(50), nullable=False, default='draft')

    akun_anggaran: Mapped["AkunAnggaran"] = relationship(back_populates="realisasi_anggaran")


class Surat(Base):
    __tablename__ = "surat"

    id_surat: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_pegawai: Mapped[int] = mapped_column(ForeignKey("pegawai.id_pegawai", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    jenis_surat: Mapped[str] = mapped_column(String(50), nullable=False)
    nomor_surat: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    tanggal: Mapped[date] = mapped_column(Date, nullable=False)
    perihal: Mapped[str] = mapped_column(Text, nullable=False)
    file_surat: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    pegawai: Mapped["Pegawai"] = relationship(back_populates="surat")
    disposisi: Mapped[List["Disposisi"]] = relationship(back_populates="surat")


class Disposisi(Base):
    __tablename__ = "disposisi"

    id_disposisi: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_surat: Mapped[int] = mapped_column(ForeignKey("surat.id_surat", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    id_pegawai: Mapped[int] = mapped_column(ForeignKey("pegawai.id_pegawai", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    instruksi: Mapped[str] = mapped_column(Text, nullable=False)
    tanggal_disposisi: Mapped[date] = mapped_column(Date, nullable=False)

    surat: Mapped["Surat"] = relationship(back_populates="disposisi")
    pegawai: Mapped["Pegawai"] = relationship(back_populates="disposisi")


class DokumenArsip(Base):
    __tablename__ = "dokumen_arsip"

    nama_dokumen: Mapped[str] = mapped_column(String(15), primary_key=True)
    nomor_dokumen: Mapped[int] = mapped_column(Integer, autoincrement=True, unique=True, nullable=False)
    id_pegawai: Mapped[int] = mapped_column(ForeignKey("pegawai.id_pegawai", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    kategori: Mapped[str] = mapped_column(String(100), nullable=False)
    hak_akses: Mapped[str] = mapped_column(String(50), nullable=False, default='internal')
    status_hapus: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    pegawai: Mapped["Pegawai"] = relationship(back_populates="dokumen_arsip")


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
    teks: Mapped[Optional[str]] = mapped_column(LONGTEXT, nullable=True)
    jenis_dokumen: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    lampiran_file: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    session: Mapped["ChatSession"] = relationship(back_populates="messages")
