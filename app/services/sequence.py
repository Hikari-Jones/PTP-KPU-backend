from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schema import PenomoranSequence, JenisSurat, KodeKlasifikasiArsip, Bagian

ROMAN_MONTHS = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
    7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII"
}

def get_roman_month(month: int) -> str:
    return ROMAN_MONTHS.get(month, "I")

async def get_next_nomor_surat_atomic(
    db: AsyncSession,
    tahun: int,
    id_jenis_surat: int,
    id_bagian: Optional[int] = None,
    kode_klasifikasi: str = "PL.01.1",
    kode_bagian: Optional[str] = None
) -> tuple[int, str]:
    """
    Generate next letter sequence and formatted letter number atomically.
    Uses pessimistic SELECT FOR UPDATE to prevent race conditions during concurrent letter creation.
    """
    # Fetch JenisSurat template
    jenis_stmt = select(JenisSurat).where(JenisSurat.id_jenis_surat == id_jenis_surat)
    jenis_res = await db.execute(jenis_stmt)
    jenis = jenis_res.scalar_one_or_none()
    if not jenis:
        raise ValueError(f"Jenis surat ID {id_jenis_surat} not found")

    # Select sequence row with pessimistic FOR UPDATE lock
    seq_stmt = (
        select(PenomoranSequence)
        .where(
            PenomoranSequence.tahun == tahun,
            PenomoranSequence.id_jenis_surat == id_jenis_surat,
            (PenomoranSequence.id_bagian == id_bagian) | (PenomoranSequence.id_bagian.is_(None))
        )
        .with_for_update()
    )
    seq_res = await db.execute(seq_stmt)
    sequence = seq_res.scalar_one_or_none()

    if not sequence:
        sequence = PenomoranSequence(
            tahun=tahun,
            id_jenis_surat=id_jenis_surat,
            id_bagian=id_bagian,
            last_number=1
        )
        db.add(sequence)
        await db.flush()
        next_number = 1
    else:
        sequence.last_number += 1
        await db.flush()
        next_number = sequence.last_number

    # Construct formatted number according to template
    # Format template e.g. "{nomor_urut}/{kode_klasifikasi}-SD/71/{bulan_romawi}/{tahun}"
    # Satker code for KPU Provinsi Sulawesi Utara is 71
    bulan_romawi = get_roman_month(datetime_now_month())
    
    formatted_nomor = jenis.format_nomor.format(
        nomor_urut=next_number,
        kode_klasifikasi=kode_klasifikasi,
        kode_bagian=kode_bagian or "PROV",
        bulan_romawi=bulan_romawi,
        tahun=tahun
    )

    return next_number, formatted_nomor

def datetime_now_month() -> int:
    from datetime import datetime
    return datetime.now().month
