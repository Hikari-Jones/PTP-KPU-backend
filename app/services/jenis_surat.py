from app.models.schema import JenisSurat
from app.schemas.jenis_surat import JenisSuratCreate, JenisSuratUpdate
from app.services.base import CRUDBase

class CRUDJenisSurat(CRUDBase[JenisSurat, JenisSuratCreate, JenisSuratUpdate]):
    pass

jenis_surat = CRUDJenisSurat(JenisSurat)
