# Penjelasan Kode & Arsitektur Perangkat Lunak
## Aplikasi Surat Menyurat Internal KPU Provinsi Sulawesi Utara

Dokumen ini berisi penjelasan teknis mendalam mengenai setiap berkas kode (*source code*), struktur data, alur eksekusi, serta logika bisnis yang diimplementasikan pada sistem backend persuratan KPU Provinsi Sulawesi Utara.

---

## 1. Peta Struktur Berkas Proyek

```
PTP-KPU-backend/
├── database_schema.sql                # Skema DDL Database MySQL
├── DOKUMENTASI_PENGEMBANGAN_SURAT_KPU.md # Laporan Ringkas Fitur & Verifikasi
├── DOKUMENTASI_KODE_SURAT_KPU.md      # Penjelasan Detail Kode (Dokumen Ini)
└── app/
    ├── api/v1/
    │   ├── router.py                  # Pendaftaran Router Utama FastAPI
    │   └── endpoints/
    │       ├── bagian.py              # Controller Master Bagian
    │       ├── pegawai.py             # Controller Master Pegawai
    │       ├── klasifikasi.py         # Controller Kode Klasifikasi Arsip
    │       ├── jenis_surat.py         # Controller Jenis Naskah Dinas
    │       ├── surat_keluar.py        # Controller Surat Keluar & Finalisasi Atomic
    │       └── surat_tugas.py         # Controller Surat Tugas & Pelaksana
    ├── core/
    │   ├── config.py                  # Environment & App Config
    │   └── database.py                # Setup Async Engine & Session SQLAlchemy
    ├── models/
    │   ├── __init__.py                # Package Exports Model ORM
    │   └── schema.py                  # Deklarasi Kelas SQLAlchemy ORM
    ├── schemas/
    │   ├── klasifikasi.py             # Pydantic Schemas Klasifikasi
    │   ├── jenis_surat.py             # Pydantic Schemas Jenis Surat
    │   ├── surat_keluar.py            # Pydantic Schemas Surat Keluar
    │   └── surat_tugas.py             # Pydantic Schemas Surat Tugas
    └── services/
        ├── base.py                    # Base Generic CRUD Service Class
        ├── sequence.py                # Service Penomoran Atomic (FOR UPDATE Lock)
        ├── klasifikasi.py             # Service CRUD Klasifikasi
        ├── jenis_surat.py             # Service CRUD Jenis Surat
        ├── surat_keluar.py            # Service Logika Bisnis Surat Keluar & Finalisasi
        └── surat_tugas.py             # Service Logika Bisnis Surat Tugas & Pelaksana
```

---

## 2. Skema Basis Data (`database_schema.sql`)

Tabel-tabel kunci dan fungsinya:

### `penomoran_sequence`
Menyimpan *counter* nomor urut terakhir per tahun, jenis surat, dan bagian:
```sql
CREATE TABLE penomoran_sequence (
    id_sequence INT AUTO_INCREMENT PRIMARY KEY,
    tahun INT NOT NULL,
    id_jenis_surat INT NOT NULL,
    id_bagian INT NULL,
    last_number INT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_seq_rule UNIQUE (tahun, id_jenis_surat, id_bagian)
) ENGINE=InnoDB;
```
- `CONSTRAINT uq_seq_rule UNIQUE (tahun, id_jenis_surat, id_bagian)`: Menjamin tidak ada aturan urutan yang ganda untuk kombinasi tahun, jenis surat, dan bagian yang sama.

### `surat_keluar`
Menyimpan data utama surat keluar:
```sql
CREATE TABLE surat_keluar (
    id_surat_keluar INT AUTO_INCREMENT PRIMARY KEY,
    id_pegawai INT NOT NULL,
    id_bagian INT NOT NULL,
    id_klasifikasi INT NOT NULL,
    id_jenis_surat INT NOT NULL,
    nomor_surat VARCHAR(150) NULL UNIQUE,
    nomor_urut INT NULL,
    tahun INT NOT NULL,
    bulan_romawi VARCHAR(10) NOT NULL,
    sifat_surat VARCHAR(30) NOT NULL DEFAULT 'Biasa',
    perihal TEXT NOT NULL,
    tujuan_surat TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    ...
) ENGINE=InnoDB;
```
- `nomor_surat` bersifat `NULL` pada fase draft dan diisi secara otomatis saat finalisasi.

---

## 3. Model ORM SQLAlchemy (`app/models/schema.py`)

Menggunakan sintaks SQLAlchemy v2 `Mapped[...]` dan `mapped_column(...)`.

### Penanganan Dialek Kompatibel (`Text().with_variant(LONGTEXT, 'mysql')`)
```python
class SuratKeluar(Base):
    __tablename__ = "surat_keluar"

    id_surat_keluar: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nomor_surat: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, unique=True)
    isi_surat: Mapped[Optional[str]] = mapped_column(Text().with_variant(LONGTEXT, 'mysql'), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="draft")
    
    # Relationships
    klasifikasi: Mapped["KodeKlasifikasiArsip"] = relationship(back_populates="surat_keluar")
    jenis_surat: Mapped["JenisSurat"] = relationship(back_populates="surat_keluar")
    bagian: Mapped["Bagian"] = relationship(back_populates="surat_keluar")
    surat_tugas: Mapped[Optional["SuratTugas"]] = relationship(back_populates="surat_keluar", uselist=False)
```
- `Text().with_variant(LONGTEXT, 'mysql')`: Memastikan bahwa pada MySQL kolom dirender sebagai `LONGTEXT` untuk kapasitas besar, namun tetap mendukung `TEXT` standar pada SQLite atau PostgreSQL.

---

## 4. Logika Bisnis & Concurrency Lock (`app/services/`)

### A. Penomoran Atomic (`app/services/sequence.py`)

File ini bertugas mengunci baris nomor urut dan membuat string nomor surat resmi:

```python
ROMAN_MONTHS = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
    7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII"
}

async def get_next_nomor_surat_atomic(
    db: AsyncSession,
    tahun: int,
    id_jenis_surat: int,
    id_bagian: Optional[int] = None,
    kode_klasifikasi: str = "PL.01.1",
    kode_bagian: Optional[str] = None
) -> tuple[int, str]:
    # 1. Ambil template JenisSurat
    jenis_stmt = select(JenisSurat).where(JenisSurat.id_jenis_surat == id_jenis_surat)
    jenis_res = await db.execute(jenis_stmt)
    jenis = jenis_res.scalar_one()

    # 2. Lock baris sequence secara atomic dengan FOR UPDATE
    seq_stmt = (
        select(PenomoranSequence)
        .where(
            PenomoranSequence.tahun == tahun,
            PenomoranSequence.id_jenis_surat == id_jenis_surat,
            (PenomoranSequence.id_bagian == id_bagian) | (PenomoranSequence.id_bagian.is_(None))
        )
        .with_for_update()  # <-- Pessimistic Row Lock (Pencegah Duplicate)
    )
    seq_res = await db.execute(seq_stmt)
    sequence = seq_res.scalar_one_or_none()

    if not sequence:
        sequence = PenomoranSequence(tahun=tahun, id_jenis_surat=id_jenis_surat, id_bagian=id_bagian, last_number=1)
        db.add(sequence)
        await db.flush()
        next_number = 1
    else:
        sequence.last_number += 1
        await db.flush()
        next_number = sequence.last_number

    # 3. Format nomor surat sesuai aturan KPU Sulut (Kode 71)
    bulan_romawi = ROMAN_MONTHS.get(datetime.now().month, "I")
    formatted_nomor = jenis.format_nomor.format(
        nomor_urut=next_number,
        kode_klasifikasi=kode_klasifikasi,
        kode_bagian=kode_bagian or "PROV",
        bulan_romawi=bulan_romawi,
        tahun=tahun
    )

    return next_number, formatted_nomor
```

**Penjelasan Cara Kerja `with_for_update()`**:
1. Saat User 1 menekan tombol penerbitan nomor, transaksi SQL mengeksekusi `SELECT ... FOR UPDATE`.
2. MySQL mengunci (*lock*) baris `PenomoranSequence` tersebut.
3. Jika User 2 menekan tombol di waktu yang sama, transaksi User 2 **ditahan sementara (wait)** oleh MySQL hingga transaksi User 1 melakukan `COMMIT`.
4. User 1 mendapatkan nomor `1`, commit. Baris terbuka, User 2 mendapatkan nomor `2`, commit.
5. **Kesimpulan**: Duplikasi nomor bernilai **0% (nol)**.

---

### B. Manajer Surat Keluar (`app/services/surat_keluar.py`)

Mengatur alur *Drafting* $\rightarrow$ *Finalisasi Atomic* $\rightarrow$ *Pengarsipan Otomatis*:

```python
class CRUDSuratKeluar(CRUDBase[SuratKeluar, SuratKeluarCreate, SuratKeluarUpdate]):
    async def create_draft(self, db: AsyncSession, *, obj_in: SuratKeluarCreate) -> SuratKeluar:
        # Membuat record status draft tanpa mengunci nomor
        db_obj = SuratKeluar(
            id_pegawai=obj_in.id_pegawai,
            id_bagian=obj_in.id_bagian,
            id_klasifikasi=obj_in.id_klasifikasi,
            id_jenis_surat=obj_in.id_jenis_surat,
            perihal=obj_in.perihal,
            status="draft",
            ...
        )
        db.add(db_obj)
        await db.commit()
        ...
        return db_obj

    async def finalise_surat_atomic(self, db: AsyncSession, *, id_surat_keluar: int, id_pegawai_approver: int, catatan: Optional[str] = None) -> SuratKeluar:
        # Memanggil penomoran atomic
        nomor_urut, nomor_lengkap = await get_next_nomor_surat_atomic(...)

        # Update status surat menjadi terbit
        surat.nomor_urut = nomor_urut
        surat.nomor_surat = nomor_lengkap
        surat.status = "terbit"
        surat.tanggal_terbit = datetime.now()

        # Otomatis catat Audit Trail
        riwayat = RiwayatStatusSurat(...)
        db.add(riwayat)

        # Otomatis buat pengarsipan elektronik
        arsip = DokumenArsip(...)
        db.add(arsip)

        await db.commit()
        return surat
```

---

### C. Manajer Surat Tugas (`app/services/surat_tugas.py`)

Membuat Surat Tugas sekaligus menghubungkan pegawai yang ditugaskan:

```python
async def create_surat_tugas_full(db: AsyncSession, *, data: SuratTugasCreate) -> SuratTugas:
    # 1. Buat Draft Surat Keluar (Jenis ST)
    # 2. Finalisasi nomor surat keluar secara atomic
    # 3. Buat Nomor Tugas otomatis: "NT/{nomor_urut}/{tahun}"
    # 4. Simpan detail SuratTugas dan lampirkan pegawai pelaksana (SuratTugasPelaksana)
```

---

## 5. Lapisan Controller API (`app/api/v1/endpoints/`)

Controller FastAPI menjembatani HTTP request dari Frontend ke Service Layer:

### Endpoint Finalisasi Surat Keluar (`app/api/v1/endpoints/surat_keluar.py`)
```python
@router.post("/{id_surat_keluar}/finalisasi", response_model=SuratKeluarResponse)
async def finalisasi_terbit_nomor(
    *,
    db: AsyncSession = Depends(get_db),
    id_surat_keluar: int,
    request: FinalisasiSuratRequest
) -> Any:
    """
    Menerbitkan nomor surat keluar resmi secara atomic (bebas duplikasi).
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
```

---

## 6. Alur Data Lengkap (Data Flow Architecture)

```
[Frontend Javascript (Browser)]
           │
           │ 1. POST /api/v1/surat-keluar/draft (Input judul, perihal, klasifikasi)
           ▼
[FastAPI Controller (surat_keluar.py)]
           │
           │ 2. Memanggil surat_keluar.create_draft()
           ▼
[Database MySQL (surat_keluar)] ----> Disimpan sebagai Draft (tanpa nomor)
           │
           │ 3. User menekan tombol "Terbitkan Nomor Resmi"
           ▼
[FastAPI Controller /finalisasi]
           │
           │ 4. Memanggil get_next_nomor_surat_atomic()
           ▼
[Pessimistic Locking (SELECT FOR UPDATE)]
           │
           ├─► Transaction 1 (User 1) -> Menjadi Nomor Urut #101 -> Commit
           └─► Transaction 2 (User 2) -> Menjadi Nomor Urut #102 -> Commit
           │
           ▼
[Database MySQL] ----> Update nomor_surat, simpan riwayat_status_surat & dokumen_arsip
           │
           │ 5. Return JSON Response ke Browser
           ▼
[Frontend Javascript] ----> Menampilkan Nomor Surat Resmi: 101/PL.02.1-SD/71/IX/2026
```

---

## 7. Kesimpulan Kebijakan Desain Kode

1. **Clean Code & Modular**: Memisahkan logika database (Models), logika bisnis (Services), validasi DTO (Schemas), dan kontroler HTTP (Endpoints).
2. **Robust Concurrency**: Menggunakan locking di level basis data MySQL, bukan di level memori Python. Hal ini memastikan pencegahan duplikasi nomor tetap bekerja 100% aman walaupun aplikasi di-scale menggunakan *multiple worker threads/processes*.
3. **Auditability**: Seluruh pergerakan status surat dicatat di tabel `riwayat_status_surat` dan diarsipkan otomatis ke `dokumen_arsip`.
