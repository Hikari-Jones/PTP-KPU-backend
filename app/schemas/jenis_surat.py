from typing import Optional
from pydantic import BaseModel

class JenisSuratBase(BaseModel):
    kode_jenis: str
    nama_jenis: str
    format_nomor: str

class JenisSuratCreate(JenisSuratBase):
    pass

class JenisSuratUpdate(BaseModel):
    kode_jenis: Optional[str] = None
    nama_jenis: Optional[str] = None
    format_nomor: Optional[str] = None

class JenisSuratResponse(JenisSuratBase):
    id_jenis_surat: int

    class Config:
        from_attributes = True
