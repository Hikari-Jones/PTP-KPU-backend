import asyncio
from datetime import date
from decimal import Decimal
import httpx
from sqlalchemy import select, delete

from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.schema import (
    Bagian,
    Pegawai,
    TahunAnggaran,
    AkunAnggaran,
    PaguAnggaran,
    RevisiAnggaran,
    RealisasiAnggaran,
)

async def cleanup_test_data(session):
    """Clean up all records related to Phase 9 tests."""
    await session.execute(delete(RevisiAnggaran))
    await session.execute(delete(RealisasiAnggaran))
    await session.execute(delete(PaguAnggaran))
    await session.execute(delete(AkunAnggaran).where(AkunAnggaran.kode_akun.like("527%")))
    await session.execute(delete(TahunAnggaran).where(TahunAnggaran.tahun.in_([2026, 2027, 2028, 2030, 2031])))
    await session.execute(delete(Pegawai).where(Pegawai.nip.in_(["99990001", "99990002"])))
    await session.execute(delete(Bagian).where(Bagian.kode_bagian == "BAG-P9"))
    await session.commit()

async def run_phase9_tests():
    print("==================================================")
    print("STARTING PHASE 9 TAHUN ANGGARAN LOGIC TEST SUITE")
    print("==================================================")

    async with AsyncSessionLocal() as session:
        await cleanup_test_data(session)

        # 1. Base Setup: Bagian & Pegawai
        bagian = Bagian(kode_bagian="BAG-P9", nama_bagian="Divisi Phase 9")
        session.add(bagian)
        await session.flush()

        operator = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Operator Phase 9",
            nip="99990001",
            jabatan="Staff Perencanaan",
            password="pwd",
            role="operator",
        )
        admin = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Admin Phase 9",
            nip="99990002",
            jabatan="Kepala Bagian",
            password="pwd",
            role="admin",
        )
        session.add_all([operator, admin])
        await session.flush()

        # Seed two active accounts
        akun_1 = AkunAnggaran(
            id_bagian=bagian.id_bagian,
            kode_akun="5271",
            nama_akun="Akun Phase 9 Pertama",
            total_pagu=Decimal("100000000.00"),
            jenis_belanja="Operasional",
            status="active",
        )
        akun_2 = AkunAnggaran(
            id_bagian=bagian.id_bagian,
            kode_akun="5272",
            nama_akun="Akun Phase 9 Kedua",
            total_pagu=Decimal("50000000.00"),
            jenis_belanja="Operasional",
            status="active",
        )
        session.add_all([akun_1, akun_2])
        await session.commit()

        id_akun_1 = akun_1.id_akun_anggaran
        id_akun_2 = akun_2.id_akun_anggaran

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Mock auth dependency for admin & operator
        from app.core.auth import get_current_user, require_admin
        app.dependency_overrides[get_current_user] = lambda: operator
        app.dependency_overrides[require_admin] = lambda: admin

        # ============================================================
        # TEST 1: Create Tahun baru (2026, status active)
        # ============================================================
        res_t1 = await client.post("/api/v1/tahun-anggaran/", json={
            "tahun": 2026,
            "status": "active",
            "tanggal_mulai": "2026-01-01",
            "tanggal_selesai": "2026-12-31",
            "deskripsi": "Tahun Anggaran 2026 Aktif",
        })
        assert res_t1.status_code == 201, f"Expected 201, got {res_t1.status_code}: {res_t1.text}"
        data_2026 = res_t1.json()
        id_tahun_2026 = data_2026["id_tahun_anggaran"]
        print(f"[TEST 1 PASSED] Create Tahun baru 2026 (active): 201 Created (ID: {id_tahun_2026})")

        # ============================================================
        # TEST 2: Create Tahun duplicate (2026 again) -> 400 Bad Request
        # ============================================================
        res_t2 = await client.post("/api/v1/tahun-anggaran/", json={
            "tahun": 2026,
            "status": "active",
            "tanggal_mulai": "2026-01-01",
            "tanggal_selesai": "2026-12-31",
            "deskripsi": "Duplicate attempt 2026",
        })
        assert res_t2.status_code == 400, f"Expected 400, got {res_t2.status_code}: {res_t2.text}"
        assert "sudah terdaftar" in res_t2.json()["detail"].lower()
        print("[TEST 2 PASSED] Create Tahun duplicate 2026: 400 Bad Request (ditolak dengan aman)")

        # ============================================================
        # TEST 3: Auto-create Pagu saat Tahun baru dibuat
        # ============================================================
        res_pagu_26 = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_tahun_2026}")
        assert res_pagu_26.status_code == 200
        pagu_items_26 = res_pagu_26.json()["items"]
        assert len(pagu_items_26) >= 2, f"Expected at least 2 pagu, got {len(pagu_items_26)}"
        pagu_26_a1 = next((p for p in pagu_items_26 if p["id_akun_anggaran"] == id_akun_1), None)
        assert pagu_26_a1 is not None
        assert Decimal(str(pagu_26_a1["pagu_awal"])) == Decimal("0.00")
        assert Decimal(str(pagu_26_a1["pagu_aktif"])) == Decimal("0.00")
        id_pagu_26_a1 = pagu_26_a1["id_pagu"]
        print("[TEST 3 PASSED] Auto-create Pagu: Seluruh akun aktif otomatis mendapatkan Pagu dengan pagu_awal=0, pagu_aktif=0")

        # Berikan nominal pagu aktif pada 2026 via Revisi Anggaran untuk alokasi dana sah
        res_rev_26 = await client.post("/api/v1/revisi-anggaran/", json={
            "id_pagu": id_pagu_26_a1,
            "nomor_revisi": "REV-P9-INIT-26",
            "tanggal_revisi": "2026-01-10",
            "pagu_baru": "100000000.00",
            "alasan_revisi": "Alokasi awal DIPA TA 2026",
        })
        assert res_rev_26.status_code == 201

        # ============================================================
        # TEST 4: Create Tahun draft (2027) & coba buat realisasi -> 400
        # ============================================================
        res_t27 = await client.post("/api/v1/tahun-anggaran/", json={
            "tahun": 2027,
            "status": "draft",
            "tanggal_mulai": "2027-01-01",
            "tanggal_selesai": "2027-12-31",
            "deskripsi": "Tahun Anggaran 2027 Draft",
        })
        assert res_t27.status_code == 201
        id_tahun_2027 = res_t27.json()["id_tahun_anggaran"]

        # Ambil pagu 2027 untuk akun 1 dan beri saldo
        res_pagu_27 = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_tahun_2027}")
        pagu_items_27 = res_pagu_27.json()["items"]
        pagu_27_a1 = next((p for p in pagu_items_27 if p["id_akun_anggaran"] == id_akun_1), None)
        assert pagu_27_a1 is not None
        id_pagu_27_a1 = pagu_27_a1["id_pagu"]

        await client.put(f"/api/v1/pagu-anggaran/{id_pagu_27_a1}", json={
            "pagu_awal": "50000000.00",
            "pagu_aktif": "50000000.00",
        })

        # Coba post realisasi di tahun draft 2027
        res_trx_draft = await client.post("/api/v1/realisasi-anggaran/", json={
            "id_pagu": id_pagu_27_a1,
            "tanggal_transaksi": "2027-01-15",
            "nomor_dokumen": "DOC-TRX-DRAFT-27",
            "uraian_kegiatan": "Transaksi di tahun draft",
            "jumlah_realisasi": "10000000.00",
        })
        assert res_trx_draft.status_code == 400
        assert "belum aktif" in res_trx_draft.json()["detail"].lower()
        print("[TEST 4 PASSED] Tahun status draft tidak dapat menerima realisasi baru: 400 Bad Request")

        # ============================================================
        # TEST 5: Tahun active dapat membuat Realisasi -> 201, verified
        # ============================================================
        res_trx_active = await client.post("/api/v1/realisasi-anggaran/", json={
            "id_pagu": id_pagu_26_a1,
            "tanggal_transaksi": "2026-02-15",
            "nomor_dokumen": "DOC-TRX-ACTIVE-26",
            "uraian_kegiatan": "Realisasi Sah Tahun 2026",
            "jumlah_realisasi": "25000000.00",
            "periode": "Februari 2026",
        })
        assert res_trx_active.status_code == 201, f"Expected 201, got {res_trx_active.status_code}: {res_trx_active.text}"
        created_active = res_trx_active.json()
        assert created_active["status"] == "verified"
        id_realisasi_active = created_active["id_realisasi"]
        print(f"[TEST 5 PASSED] Tahun status active berhasil membuat Realisasi: 201 Created (status: verified, ID: {id_realisasi_active})")

        # ============================================================
        # TEST 6: Tutup Tahun (2028) -> closed. Coba buat Realisasi -> 400
        # ============================================================
        res_t28 = await client.post("/api/v1/tahun-anggaran/", json={
            "tahun": 2028,
            "status": "draft",
            "tanggal_mulai": "2028-01-01",
            "tanggal_selesai": "2028-12-31",
            "deskripsi": "Tahun Anggaran 2028",
        })
        assert res_t28.status_code == 201
        id_tahun_2028 = res_t28.json()["id_tahun_anggaran"]

        # Valid transition: draft -> active -> closed
        await client.put(f"/api/v1/tahun-anggaran/{id_tahun_2028}", json={"status": "active"})
        await client.put(f"/api/v1/tahun-anggaran/{id_tahun_2028}", json={"status": "closed"})

        # Ambil pagu 2028
        res_pagu_28 = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_tahun_2028}")
        pagu_28_a1 = next((p for p in res_pagu_28.json()["items"] if p["id_akun_anggaran"] == id_akun_1), None)
        assert pagu_28_a1 is not None
        id_pagu_28_a1 = pagu_28_a1["id_pagu"]

        # Realisasi pada tahun closed harus ditolak
        res_trx_closed = await client.post("/api/v1/realisasi-anggaran/", json={
            "id_pagu": id_pagu_28_a1,
            "tanggal_transaksi": "2028-03-01",
            "nomor_dokumen": "DOC-TRX-CLOSED-28",
            "uraian_kegiatan": "Realisasi di tahun closed",
            "jumlah_realisasi": "5000000.00",
        })
        assert res_trx_closed.status_code == 400
        assert "sudah ditutup" in res_trx_closed.json()["detail"].lower()
        print("[TEST 6 PASSED] Tahun status closed menolak Realisasi baru: 400 Bad Request")

        # ============================================================
        # TEST 7: Tahun closed tetap dapat dibaca -> 200 OK
        # ============================================================
        res_read_closed = await client.get(f"/api/v1/tahun-anggaran/{id_tahun_2028}")
        assert res_read_closed.status_code == 200
        assert res_read_closed.json()["status"] == "closed"
        print("[TEST 7 PASSED] Tahun closed tetap dapat dibaca: 200 OK")

        # ============================================================
        # TEST 8: Pagu terisolasi berdasarkan Tahun (2026 != 2027)
        # ============================================================
        res_p26 = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_tahun_2026}")
        res_p27 = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_tahun_2027}")
        assert all(p["id_tahun_anggaran"] == id_tahun_2026 for p in res_p26.json()["items"])
        assert all(p["id_tahun_anggaran"] == id_tahun_2027 for p in res_p27.json()["items"])
        print("[TEST 8 PASSED] Pagu terisolasi berdasarkan Tahun: 2026 != 2027")

        # ============================================================
        # TEST 9: Summary Tahun 2026 terisolasi dari Tahun lain
        # ============================================================
        res_sum26 = await client.get(f"/api/v1/anggaran/summary?id_tahun_anggaran={id_tahun_2026}")
        assert res_sum26.status_code == 200
        sum26 = res_sum26.json()
        assert Decimal(str(sum26["total_realisasi_verified"])) == Decimal("25000000.00")
        assert Decimal(str(sum26["total_pagu_aktif"])) == Decimal("100000000.00")
        assert Decimal(str(sum26["total_sisa_anggaran"])) == Decimal("75000000.00")
        assert sum26["persentase_serapan"] == 25.0
        print(f"[TEST 9 PASSED] Summary terisolasi berdasarkan Tahun 2026: Realisasi=25M, Sisa=75M, Serapan=25.0%")

        # ============================================================
        # TEST 10, 11, 12: Create Account baru:
        # - Tahun closed (2028) tidak membuat pagu
        # - Tahun draft (2027) membuat pagu
        # - Tahun active (2026) membuat pagu
        # ============================================================
        res_new_acc = await client.post("/api/v1/akun-anggaran/", json={
            "id_bagian": bagian.id_bagian,
            "kode_akun": "5273",
            "nama_akun": "Akun Uji Lifecycle P9",
            "jenis_belanja": "Modal",
            "status": "active",
        })
        assert res_new_acc.status_code == 201
        id_new_acc = res_new_acc.json()["id_akun_anggaran"]

        # Check pagu for this account across the 3 years
        # 1. Closed year 2028: NO pagu
        res_p28_new = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_tahun_2028}&id_akun_anggaran={id_new_acc}")
        assert res_p28_new.json()["total"] == 0, "Closed year must NOT receive auto-pagu"
        print("[TEST 10 PASSED] Create Account pada Tahun closed TIDAK membuat Pagu baru")

        # 2. Draft year 2027: YES pagu
        res_p27_new = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_tahun_2027}&id_akun_anggaran={id_new_acc}")
        assert res_p27_new.json()["total"] == 1, "Draft year must receive auto-pagu"
        print("[TEST 11 PASSED] Create Account pada Tahun draft MEMBUAT Pagu baru")

        # 3. Active year 2026: YES pagu
        res_p26_new = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_tahun_2026}&id_akun_anggaran={id_new_acc}")
        assert res_p26_new.json()["total"] == 1, "Active year must receive auto-pagu"
        print("[TEST 12 PASSED] Create Account pada Tahun active MEMBUAT Pagu baru")

        # ============================================================
        # TEST 13: Concurrent create Tahun yang sama (2030)
        # ============================================================
        req_a = client.post("/api/v1/tahun-anggaran/", json={
            "tahun": 2030,
            "status": "draft",
            "tanggal_mulai": "2030-01-01",
            "tanggal_selesai": "2030-12-31",
            "deskripsi": "Concurrent TA 2030 A",
        })
        req_b = client.post("/api/v1/tahun-anggaran/", json={
            "tahun": 2030,
            "status": "draft",
            "tanggal_mulai": "2030-01-01",
            "tanggal_selesai": "2030-12-31",
            "deskripsi": "Concurrent TA 2030 B",
        })
        resp_a, resp_b = await asyncio.gather(req_a, req_b)
        codes = [resp_a.status_code, resp_b.status_code]
        assert 201 in codes, "One concurrent creation must succeed"
        assert (400 in codes or 409 in codes or 500 in codes), "Duplicate concurrent creation must be rejected"
        print("[TEST 13 PASSED] Concurrent create Tahun yang sama: Satu sukses (201), duplikasi ditolak")

        # ============================================================
        # TEST 14: Verified Realisasi pada Tahun closed tetap immutable
        # ============================================================
        # Tutup tahun 2026 (active -> closed)
        res_close_26 = await client.put(f"/api/v1/tahun-anggaran/{id_tahun_2026}", json={"status": "closed"})
        assert res_close_26.status_code == 200

        # Coba PUT / DELETE realisasi_active (verified)
        res_put_trx = await client.put(f"/api/v1/realisasi-anggaran/{id_realisasi_active}", json={
            "uraian_kegiatan": "Attempt modify verified in closed year",
        })
        assert res_put_trx.status_code == 400
        assert "tidak dapat diubah" in res_put_trx.json()["detail"].lower()

        res_del_trx = await client.delete(f"/api/v1/realisasi-anggaran/{id_realisasi_active}")
        assert res_del_trx.status_code == 400
        assert "hanya transaksi berstatus 'draft' yang dapat dihapus" in res_del_trx.json()["detail"].lower()
        print("[TEST 14 PASSED] Verified Realisasi pada Tahun closed tetap immutable: PUT dan DELETE ditolak")

        # Test state transition protection: closed cannot be changed back to active or draft
        res_reopen = await client.put(f"/api/v1/tahun-anggaran/{id_tahun_2026}", json={"status": "active"})
        assert res_reopen.status_code == 400
        assert "tidak diizinkan" in res_reopen.json()["detail"].lower()
        print("[LIFECYCLE TRANSITION PASSED] Transisi status closed kembali ke active/draft ditolak: 400 Bad Request")

    # Cleanup
    async with AsyncSessionLocal() as session:
        await cleanup_test_data(session)

    print("==================================================")
    print("ALL 14 PHASE 9 TEST SCENARIOS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_phase9_tests())
