from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.klasifikasi import KodeKlasifikasiResponse
from app.schemas.jenis_surat import JenisSuratResponse

class SuratKeluarBase(BaseModel):
    id_bagian: int
    id_klasifikasi: int
    id_jenis_surat: int
    sifat_surat: str = "Biasa"
    lampiran: Optional[str] = "-"
    perihal: str
    tujuan_surat: str
    isi_surat: Optional[str] = None
    tanggal_surat: date

class SuratKeluarCreate(SuratKeluarBase):
    id_pegawai: int

class SuratKeluarUpdate(BaseModel):
    id_bagian: Optional[int] = None
    id_klasifikasi: Optional[int] = None
    id_jenis_surat: Optional[int] = None
    sifat_surat: Optional[str] = None
    lampiran: Optional[str] = None
    perihal: Optional[str] = None
    tujuan_surat: Optional[str] = None
    isi_surat: Optional[str] = None
    file_surat: Optional[str] = None
    tanggal_surat: Optional[date] = None

class SuratKeluarResponse(SuratKeluarBase):
    id_surat_keluar: int
    id_pegawai: int
    nomor_surat: Optional[str] = None
    nomor_urut: Optional[int] = None
    tahun: int
    bulan_romawi: str
    file_surat: Optional[str] = None
    status: str
    tanggal_terbit: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    klasifikasi: Optional[KodeKlasifikasiResponse] = None
    jenis_surat: Optional[JenisSuratResponse] = None

    class Config:
        from_attributes = True

class FinalisasiSuratRequest(BaseModel):
    id_pegawai: int
    catatan: Optional[str] = "Penerbitan nomor surat keluar secara otomatis"
