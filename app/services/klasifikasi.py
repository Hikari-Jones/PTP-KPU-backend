from app.models.schema import KodeKlasifikasiArsip
from app.schemas.klasifikasi import KodeKlasifikasiCreate, KodeKlasifikasiUpdate
from app.services.base import CRUDBase

class CRUDKodeKlasifikasi(CRUDBase[KodeKlasifikasiArsip, KodeKlasifikasiCreate, KodeKlasifikasiUpdate]):
    pass

klasifikasi = CRUDKodeKlasifikasi(KodeKlasifikasiArsip)
