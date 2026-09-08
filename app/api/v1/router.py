from fastapi import APIRouter
from app.api.v1.endpoints import bagian, pegawai, arsip

api_router = APIRouter()

@api_router.get("/status")
async def status():
    return {"status": "v1 API is operational"}

api_router.include_router(bagian.router, prefix="/bagian", tags=["Bagian"])
api_router.include_router(pegawai.router, prefix="/pegawai", tags=["Pegawai"])
api_router.include_router(arsip.router, prefix="/arsip", tags=["Arsip"])

