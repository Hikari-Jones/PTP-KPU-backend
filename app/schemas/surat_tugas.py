from datetime import date
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.surat_keluar import SuratKeluarResponse, SuratKeluarCreate

class PelaksanaTugasCreate(BaseModel):
    id_pegawai: int
    peran_tugas: str = "Pelaksana"

class PelaksanaTugasResponse(BaseModel):
    id_pelaksana: int
    id_surat_tugas: int
    id_pegawai: int
    peran_tugas: str

    class Config:
        from_attributes = True

class SuratTugasCreate(BaseModel):
    id_pegawai_pembuat: int
    id_bagian: int
    id_klasifikasi: int
    perihal: str
    tujuan_surat: str = "Yang Bersangkutan"
    isi_surat: Optional[str] = None
    tanggal_surat: date
    
    maksud_tugas: str
    tempat_tugas: str
    tanggal_mulai: date
    tanggal_selesai: date
    beban_anggaran: Optional[str] = "DIPA KPU Provinsi Sulawesi Utara"
    
    pelaksana_ids: List[PelaksanaTugasCreate]

class SuratTugasResponse(BaseModel):
    id_surat_tugas: int
    id_surat_keluar: int
    nomor_tugas: str
    maksud_tugas: str
    tempat_tugas: str
    tanggal_mulai: date
    tanggal_selesai: date
    beban_anggaran: Optional[str] = None

    surat_keluar: Optional[SuratKeluarResponse] = None
    pelaksana: List[PelaksanaTugasResponse] = []

    class Config:
        from_attributes = True
