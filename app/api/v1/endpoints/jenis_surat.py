from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.jenis_surat import JenisSuratCreate, JenisSuratUpdate, JenisSuratResponse
from app.services.jenis_surat import jenis_surat

router = APIRouter()

@router.get("/", response_model=List[JenisSuratResponse])
async def read_jenis_surat(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve all Jenis Surat.
    """
    return await jenis_surat.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=JenisSuratResponse, status_code=status.HTTP_201_CREATED)
async def create_jenis_surat(
    *,
    db: AsyncSession = Depends(get_db),
    jenis_in: JenisSuratCreate,
) -> Any:
    """
    Create new Jenis Surat.
    """
    return await jenis_surat.create(db, obj_in=jenis_in)
