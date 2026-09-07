from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.surat_keluar import (
    SuratKeluarCreate, SuratKeluarUpdate, SuratKeluarResponse, FinalisasiSuratRequest
)
from app.services.surat_keluar import surat_keluar

router = APIRouter()

@router.get("/", response_model=List[SuratKeluarResponse])
async def read_surat_keluar(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    id_bagian: Optional[int] = None,
    tahun: Optional[int] = None
) -> Any:
    """
    Retrieve Surat Keluar with optional filters.
    """
    return await surat_keluar.get_multi_filtered(
        db, skip=skip, limit=limit, status=status, id_bagian=id_bagian, tahun=tahun
    )

@router.post("/draft", response_model=SuratKeluarResponse, status_code=status.HTTP_201_CREATED)
async def create_draft_surat_keluar(
    *,
    db: AsyncSession = Depends(get_db),
    surat_in: SuratKeluarCreate,
) -> Any:
    """
    Create a new draft outgoing letter without assigning letter number yet.
    """
    return await surat_keluar.create_draft(db, obj_in=surat_in)

@router.post("/{id_surat_keluar}/finalisasi", response_model=SuratKeluarResponse)
async def finalisasi_terbit_nomor(
    *,
    db: AsyncSession = Depends(get_db),
    id_surat_keluar: int,
    request: FinalisasiSuratRequest
) -> Any:
    """
    Atomically issues letter number using FOR UPDATE pessimistic lock to prevent race conditions.
    """
    try:
        return await surat_keluar.finalise_surat_atomic(
            db,
            id_surat_keluar=id_surat_keluar,
            id_pegawai_approver=request.id_pegawai,
            catatan=request.catatan
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
