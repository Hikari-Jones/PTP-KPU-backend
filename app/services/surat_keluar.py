from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.schema import (
    SuratKeluar, KodeKlasifikasiArsip, JenisSurat, Bagian,
    RiwayatStatusSurat, DokumenArsip
)
from app.schemas.surat_keluar import SuratKeluarCreate, SuratKeluarUpdate
from app.services.base import CRUDBase
from app.services.sequence import get_next_nomor_surat_atomic, get_roman_month

class CRUDSuratKeluar(CRUDBase[SuratKeluar, SuratKeluarCreate, SuratKeluarUpdate]):
    async def create_draft(self, db: AsyncSession, *, obj_in: SuratKeluarCreate) -> SuratKeluar:
        bulan_romawi = get_roman_month(obj_in.tanggal_surat.month)
        tahun = obj_in.tanggal_surat.year

        db_obj = SuratKeluar(
            id_pegawai=obj_in.id_pegawai,
            id_bagian=obj_in.id_bagian,
            id_klasifikasi=obj_in.id_klasifikasi,
            id_jenis_surat=obj_in.id_jenis_surat,
            sifat_surat=obj_in.sifat_surat,
            lampiran=obj_in.lampiran,
            perihal=obj_in.perihal,
            tujuan_surat=obj_in.tujuan_surat,
            isi_surat=obj_in.isi_surat,
            tanggal_surat=obj_in.tanggal_surat,
            tahun=tahun,
            bulan_romawi=bulan_romawi,
            status="draft"
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        # Log initial audit trail
        riwayat = RiwayatStatusSurat(
            id_surat_keluar=db_obj.id_surat_keluar,
            id_pegawai=obj_in.id_pegawai,
            status_lama=None,
            status_baru="draft",
            catatan="Draft surat keluar berhasil dibuat"
        )
        db.add(riwayat)
        await db.commit()

        return db_obj

    async def finalise_surat_atomic(
        self,
        db: AsyncSession,
        *,
        id_surat_keluar: int,
        id_pegawai_approver: int,
        catatan: Optional[str] = None
    ) -> SuratKeluar:
        """
        Atomically issues letter number using FOR UPDATE pessimistic lock to prevent race conditions.
        """
        stmt = (
            select(SuratKeluar)
            .where(SuratKeluar.id_surat_keluar == id_surat_keluar)
            .options(
                selectinload(SuratKeluar.klasifikasi),
                selectinload(SuratKeluar.jenis_surat),
                selectinload(SuratKeluar.bagian)
            )
        )
        res = await db.execute(stmt)
        surat = res.scalar_one_or_none()
        if not surat:
            raise ValueError(f"Surat keluar dengan ID {id_surat_keluar} tidak ditemukan")

        if surat.status in ["terbit", "diarsipkan"]:
            raise ValueError(f"Surat keluar sudah diterbitkan sebelumnya dengan nomor {surat.nomor_surat}")

        # Fetch codes needed for formatting
        kode_klasifikasi = surat.klasifikasi.kode_klasifikasi if surat.klasifikasi else "PL.01.1"
        kode_bagian = surat.bagian.kode_bagian if surat.bagian else "PROV"

        # Generate number atomically inside transaction
        nomor_urut, nomor_lengkap = await get_next_nomor_surat_atomic(
            db=db,
            tahun=surat.tahun,
            id_jenis_surat=surat.id_jenis_surat,
            id_bagian=surat.id_bagian,
            kode_klasifikasi=kode_klasifikasi,
            kode_bagian=kode_bagian
        )

        status_lama = surat.status
        surat.nomor_urut = nomor_urut
        surat.nomor_surat = nomor_lengkap
        surat.status = "terbit"
        surat.tanggal_terbit = datetime.now()

        # Audit log entry
        riwayat = RiwayatStatusSurat(
            id_surat_keluar=surat.id_surat_keluar,
            id_pegawai=id_pegawai_approver,
            status_lama=status_lama,
            status_baru="terbit",
            catatan=catatan or f"Penerbitan nomor surat resmi: {nomor_lengkap}"
        )
        db.add(riwayat)

        # Automatic electronic archive entry creation
        arsip = DokumenArsip(
            id_surat_keluar=surat.id_surat_keluar,
            id_klasifikasi=surat.id_klasifikasi,
            id_pegawai=surat.id_pegawai,
            nama_dokumen=f"{surat.jenis_surat.nama_jenis} - {surat.perihal}",
            nomor_dokumen=nomor_lengkap,
            kategori=surat.klasifikasi.kategori_utama,
            hak_akses=surat.klasifikasi.hak_akses,
            file_path=surat.file_surat
        )
        db.add(arsip)

        await db.commit()
        await db.refresh(surat)
        return surat

    async def get_multi_filtered(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        id_bagian: Optional[int] = None,
        tahun: Optional[int] = None
    ) -> List[SuratKeluar]:
        stmt = (
            select(SuratKeluar)
            .options(
                selectinload(SuratKeluar.klasifikasi),
                selectinload(SuratKeluar.jenis_surat)
            )
        )
        if status:
            stmt = stmt.where(SuratKeluar.status == status)
        if id_bagian:
            stmt = stmt.where(SuratKeluar.id_bagian == id_bagian)
        if tahun:
            stmt = stmt.where(SuratKeluar.tahun == tahun)

        stmt = stmt.order_by(SuratKeluar.id_surat_keluar.desc()).offset(skip).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

surat_keluar = CRUDSuratKeluar(SuratKeluar)
