from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.schema import SuratKeluar, SuratTugas, SuratTugasPelaksana, JenisSurat
from app.schemas.surat_tugas import SuratTugasCreate
from app.schemas.surat_keluar import SuratKeluarCreate
from app.services.surat_keluar import surat_keluar

async def create_surat_tugas_full(
    db: AsyncSession,
    *,
    data: SuratTugasCreate
) -> SuratTugas:
    # 1. Fetch or verify JenisSurat ST
    stmt_jenis = select(JenisSurat).where(JenisSurat.kode_jenis == "ST")
    res_jenis = await db.execute(stmt_jenis)
    jenis_st = res_jenis.scalar_one_or_none()
    
    id_jenis = jenis_st.id_jenis_surat if jenis_st else 2

    # 2. Create SuratKeluar base draft
    sk_create = SuratKeluarCreate(
        id_pegawai=data.id_pegawai_pembuat,
        id_bagian=data.id_bagian,
        id_klasifikasi=data.id_klasifikasi,
        id_jenis_surat=id_jenis,
        sifat_surat="Biasa",
        lampiran="-",
        perihal=data.perihal,
        tujuan_surat=data.tujuan_surat,
        isi_surat=data.isi_surat,
        tanggal_surat=data.tanggal_surat
    )
    draft_sk = await surat_keluar.create_draft(db, obj_in=sk_create)

    # 3. Finalize letter number atomically
    final_sk = await surat_keluar.finalise_surat_atomic(
        db,
        id_surat_keluar=draft_sk.id_surat_keluar,
        id_pegawai_approver=data.id_pegawai_pembuat,
        catatan="Penerbitan Surat Tugas otomatis"
    )

    # 4. Generate Nomor Tugas
    nomor_tugas = f"NT/{final_sk.nomor_urut:03d}/{final_sk.tahun}"

    # 5. Create SuratTugas record
    st_obj = SuratTugas(
        id_surat_keluar=final_sk.id_surat_keluar,
        nomor_tugas=nomor_tugas,
        maksud_tugas=data.maksud_tugas,
        tempat_tugas=data.tempat_tugas,
        tanggal_mulai=data.tanggal_mulai,
        tanggal_selesai=data.tanggal_selesai,
        beban_anggaran=data.beban_anggaran
    )
    db.add(st_obj)
    await db.flush()

    # 6. Add Pelaksana Pegawai
    for p in data.pelaksana_ids:
        pelaksana = SuratTugasPelaksana(
            id_surat_tugas=st_obj.id_surat_tugas,
            id_pegawai=p.id_pegawai,
            peran_tugas=p.peran_tugas
        )
        db.add(pelaksana)

    await db.commit()

    # Query full object with relationships
    stmt_full = (
        select(SuratTugas)
        .where(SuratTugas.id_surat_tugas == st_obj.id_surat_tugas)
        .options(
            selectinload(SuratTugas.surat_keluar).selectinload(SuratKeluar.klasifikasi),
            selectinload(SuratTugas.surat_keluar).selectinload(SuratKeluar.jenis_surat),
            selectinload(SuratTugas.pelaksana)
        )
    )
    res_full = await db.execute(stmt_full)
    return res_full.scalar_one()

async def get_surat_tugas_multi(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100
) -> List[SuratTugas]:
    stmt = (
        select(SuratTugas)
        .options(
            selectinload(SuratTugas.surat_keluar).selectinload(SuratKeluar.klasifikasi),
            selectinload(SuratTugas.surat_keluar).selectinload(SuratKeluar.jenis_surat),
            selectinload(SuratTugas.pelaksana)
        )
        .order_by(SuratTugas.id_surat_tugas.desc())
        .offset(skip)
        .limit(limit)
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())
