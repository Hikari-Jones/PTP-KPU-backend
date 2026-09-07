from fastapi import APIRouter
from app.api.v1.endpoints import bagian, pegawai, klasifikasi, jenis_surat, surat_keluar, surat_tugas

api_router = APIRouter()

@api_router.get("/status")
async def status():
    return {"status": "v1 API is operational"}

api_router.include_router(bagian.router, prefix="/bagian", tags=["Bagian"])
api_router.include_router(pegawai.router, prefix="/pegawai", tags=["Pegawai"])
api_router.include_router(klasifikasi.router, prefix="/klasifikasi", tags=["Kode Klasifikasi Arsip"])
api_router.include_router(jenis_surat.router, prefix="/jenis-surat", tags=["Jenis Surat"])
api_router.include_router(surat_keluar.router, prefix="/surat-keluar", tags=["Surat Keluar"])
api_router.include_router(surat_tugas.router, prefix="/surat-tugas", tags=["Surat Tugas"])
