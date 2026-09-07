from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.klasifikasi import KodeKlasifikasiCreate, KodeKlasifikasiUpdate, KodeKlasifikasiResponse
from app.services.klasifikasi import klasifikasi

router = APIRouter()

@router.get("/", response_model=List[KodeKlasifikasiResponse])
async def read_klasifikasi(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve all Kode Klasifikasi Arsip.
    """
    return await klasifikasi.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=KodeKlasifikasiResponse, status_code=status.HTTP_201_CREATED)
async def create_klasifikasi(
    *,
    db: AsyncSession = Depends(get_db),
    klasifikasi_in: KodeKlasifikasiCreate,
) -> Any:
    """
    Create new Kode Klasifikasi Arsip.
    """
    return await klasifikasi.create(db, obj_in=klasifikasi_in)

@router.get("/{id_klasifikasi}", response_model=KodeKlasifikasiResponse)
async def read_klasifikasi_by_id(
    *,
    db: AsyncSession = Depends(get_db),
    id_klasifikasi: int,
) -> Any:
    """
    Get specific Kode Klasifikasi by ID.
    """
    item = await klasifikasi.get(db, id=id_klasifikasi)
    if not item:
        raise HTTPException(status_code=404, detail="Kode klasifikasi not found")
    return item
