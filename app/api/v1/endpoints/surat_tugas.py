from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.surat_tugas import SuratTugasCreate, SuratTugasResponse
from app.services.surat_tugas import create_surat_tugas_full, get_surat_tugas_multi

router = APIRouter()

@router.get("/", response_model=List[SuratTugasResponse])
async def read_surat_tugas(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve Surat Tugas with assigned staff.
    """
    return await get_surat_tugas_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=SuratTugasResponse, status_code=status.HTTP_201_CREATED)
async def create_surat_tugas(
    *,
    db: AsyncSession = Depends(get_db),
    surat_tugas_in: SuratTugasCreate,
) -> Any:
    """
    Create a new Surat Tugas with auto-generated task number and staff assignment.
    """
    try:
        return await create_surat_tugas_full(db, data=surat_tugas_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
