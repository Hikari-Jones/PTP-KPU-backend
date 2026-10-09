from fastapi import APIRouter
from app.api.v1.endpoints import bagian, pegawai, arsip, anggaran

api_router = APIRouter()

@api_router.get("/status")
async def status():
    return {"status": "v1 API is operational"}

api_router.include_router(bagian.router, prefix="/bagian", tags=["Bagian"])
api_router.include_router(pegawai.router, prefix="/pegawai", tags=["Pegawai"])
api_router.include_router(arsip.router, prefix="/arsip", tags=["Arsip"])

# Modul Realisasi Anggaran Endpoints
api_router.include_router(anggaran.tahun_router, prefix="/tahun-anggaran", tags=["Tahun Anggaran"])
api_router.include_router(anggaran.akun_router, prefix="/akun-anggaran", tags=["Akun Anggaran"])
api_router.include_router(anggaran.pagu_router, prefix="/pagu-anggaran", tags=["Pagu Anggaran"])
api_router.include_router(anggaran.revisi_router, prefix="/revisi-anggaran", tags=["Revisi Anggaran"])
api_router.include_router(anggaran.realisasi_router, prefix="/realisasi-anggaran", tags=["Realisasi Anggaran"])
api_router.include_router(anggaran.dashboard_router, prefix="/anggaran", tags=["Ringkasan Anggaran"])

