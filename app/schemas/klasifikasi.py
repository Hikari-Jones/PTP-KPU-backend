from typing import Optional
from pydantic import BaseModel

class KodeKlasifikasiBase(BaseModel):
    kode_klasifikasi: str
    nama_klasifikasi: str
    kategori_utama: str
    deskripsi: Optional[str] = None
    retensi_aktif_tahun: int = 2
    retensi_inaktif_tahun: int = 5
    hak_akses: str = "Internal"

class KodeKlasifikasiCreate(KodeKlasifikasiBase):
    pass

class KodeKlasifikasiUpdate(BaseModel):
    kode_klasifikasi: Optional[str] = None
    nama_klasifikasi: Optional[str] = None
    kategori_utama: Optional[str] = None
    deskripsi: Optional[str] = None
    retensi_aktif_tahun: Optional[int] = None
    retensi_inaktif_tahun: Optional[int] = None
    hak_akses: Optional[str] = None

class KodeKlasifikasiResponse(KodeKlasifikasiBase):
    id_klasifikasi: int

    class Config:
        from_attributes = True
