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
    """Clean up all records related to Phase 8 tests."""
    await session.execute(delete(RevisiAnggaran))
    await session.execute(delete(RealisasiAnggaran))
    await session.execute(delete(PaguAnggaran))
    await session.execute(delete(AkunAnggaran).where(AkunAnggaran.kode_akun.like("528%")))
    await session.execute(delete(TahunAnggaran).where(TahunAnggaran.tahun.in_([2026, 2027])))
    await session.execute(delete(Pegawai).where(Pegawai.nip.in_(["88880001", "88880002"])))
    await session.execute(delete(Bagian).where(Bagian.kode_bagian == "BAG-P8"))
    await session.commit()

async def run_phase8_tests():
    print("==================================================")
    print("STARTING PHASE 8 REALISASI ENDPOINTS TEST SUITE")
    print("==================================================")

    async with AsyncSessionLocal() as session:
        await cleanup_test_data(session)

        # 1. Base Setup: Bagian & Pegawai
        bagian = Bagian(kode_bagian="BAG-P8", nama_bagian="Divisi Phase 8")
        session.add(bagian)
        await session.flush()

        operator = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Operator Phase 8",
            nip="88880001",
            jabatan="Staff Perencanaan",
            password="pwd",
            role="operator",
        )
        admin = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Admin Phase 8",
            nip="88880002",
            jabatan="Kepala Bagian",
            password="pwd",
            role="admin",
        )
        session.add_all([operator, admin])
        await session.flush()

        # 2. Setup Tahun 2026 (active) & Tahun 2027 (draft)
        tahun_2026 = TahunAnggaran(
            tahun=2026,
            status="active",
            tanggal_mulai=date(2026, 1, 1),
            tanggal_selesai=date(2026, 12, 31),
            deskripsi="TA 2026 Active",
            id_pegawai_pembuat=admin.id_pegawai,
        )
        tahun_2027 = TahunAnggaran(
            tahun=2027,
            status="draft",
            tanggal_mulai=date(2027, 1, 1),
            tanggal_selesai=date(2027, 12, 31),
            deskripsi="TA 2027 Draft",
            id_pegawai_pembuat=admin.id_pegawai,
        )
        session.add_all([tahun_2026, tahun_2027])
        await session.flush()

        # 3. Setup Akun A (5281) & Akun B (5282)
        akun_a = AkunAnggaran(
            id_bagian=bagian.id_bagian,
            kode_akun="5281",
            nama_akun="Belanja Akun A Phase 8",
            total_pagu=Decimal("100000000.00"),
            jenis_belanja="Operasional",
            status="active",
        )
        akun_b = AkunAnggaran(
            id_bagian=bagian.id_bagian,
            kode_akun="5282",
            nama_akun="Belanja Akun B Phase 8",
            total_pagu=Decimal("50000000.00"),
            jenis_belanja="Operasional",
            status="active",
        )
        session.add_all([akun_a, akun_b])
        await session.flush()

        # Get or setup Pagu records
        # Akun creation auto-creates pagu in active years (Phase 5)
        res_pagu_a = await session.execute(
            select(PaguAnggaran).where(
                PaguAnggaran.id_tahun_anggaran == tahun_2026.id_tahun_anggaran,
                PaguAnggaran.id_akun_anggaran == akun_a.id_akun_anggaran,
            )
        )
        pagu_a = res_pagu_a.scalar_one_or_none()
        if not pagu_a:
            pagu_a = PaguAnggaran(
                id_tahun_anggaran=tahun_2026.id_tahun_anggaran,
                id_akun_anggaran=akun_a.id_akun_anggaran,
                pagu_awal=Decimal("100000000.00"),
                pagu_aktif=Decimal("100000000.00"),
            )
            session.add(pagu_a)
        else:
            pagu_a.pagu_awal = Decimal("100000000.00")
            pagu_a.pagu_aktif = Decimal("100000000.00")

        res_pagu_b = await session.execute(
            select(PaguAnggaran).where(
                PaguAnggaran.id_tahun_anggaran == tahun_2026.id_tahun_anggaran,
                PaguAnggaran.id_akun_anggaran == akun_b.id_akun_anggaran,
            )
        )
        pagu_b = res_pagu_b.scalar_one_or_none()
        if not pagu_b:
            pagu_b = PaguAnggaran(
                id_tahun_anggaran=tahun_2026.id_tahun_anggaran,
                id_akun_anggaran=akun_b.id_akun_anggaran,
                pagu_awal=Decimal("50000000.00"),
                pagu_aktif=Decimal("50000000.00"),
            )
            session.add(pagu_b)
        else:
            pagu_b.pagu_awal = Decimal("50000000.00")
            pagu_b.pagu_aktif = Decimal("50000000.00")

        # Pagu for inactive year 2027
        res_pagu_27 = await session.execute(
            select(PaguAnggaran).where(
                PaguAnggaran.id_tahun_anggaran == tahun_2027.id_tahun_anggaran,
                PaguAnggaran.id_akun_anggaran == akun_a.id_akun_anggaran,
            )
        )
        pagu_2027 = res_pagu_27.scalar_one_or_none()
        if not pagu_2027:
            pagu_2027 = PaguAnggaran(
                id_tahun_anggaran=tahun_2027.id_tahun_anggaran,
                id_akun_anggaran=akun_a.id_akun_anggaran,
                pagu_awal=Decimal("30000000.00"),
                pagu_aktif=Decimal("30000000.00"),
            )
            session.add(pagu_2027)

        await session.commit()
        await session.refresh(pagu_a)
        await session.refresh(pagu_b)
        await session.refresh(pagu_2027)

        id_pagu_a = pagu_a.id_pagu
        id_pagu_b = pagu_b.id_pagu
        id_pagu_27 = pagu_2027.id_pagu
        id_tahun_26 = tahun_2026.id_tahun_anggaran
        id_tahun_27 = tahun_2027.id_tahun_anggaran
        id_akun_a = akun_a.id_akun_anggaran
        id_akun_b = akun_b.id_akun_anggaran

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Mock auth dependency
        from app.core.auth import get_current_user, require_admin
        app.dependency_overrides[get_current_user] = lambda: operator
        app.dependency_overrides[require_admin] = lambda: admin

        # ============================================================
        # TEST 1: GET list tanpa filter
        # ============================================================
        res = await client.get("/api/v1/realisasi-anggaran/")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert "items" in data and "total" in data
        print(f"[TEST 1 PASSED] GET list tanpa filter: 200 OK (total items: {data['total']})")

        # ============================================================
        # TEST 7 & 8: POST direct realisasi (verified, not draft)
        # ============================================================
        payload_1 = {
            "id_pagu": id_pagu_a,
            "tanggal_transaksi": "2026-01-15",
            "nomor_dokumen": "DOC-P8-001",
            "uraian_kegiatan": "Pengadaan ATK Pleno Januari",
            "jumlah_realisasi": "25000000.00",
            "periode": "Januari 2026",
            "bukti_file_nama": "spk_atk.pdf",
        }
        res = await client.post("/api/v1/realisasi-anggaran/", json=payload_1)
        assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
        created_1 = res.json()
        assert created_1["status"] == "verified", f"Expected verified, got {created_1['status']}"
        assert created_1["id_verifier"] is None, "id_verifier must be null"
        assert created_1["verified_at"] is not None, "verified_at must be populated"
        assert created_1["catatan_verifikasi"] == "Validasi otomatis sistem (Direct Realisasi)"
        assert Decimal(created_1["jumlah_realisasi"]) == Decimal("25000000.00")
        id_realisasi_1 = created_1["id_realisasi"]
        print(f"[TEST 7 & 8 PASSED] POST direct realisasi: 201 Created (ID: {id_realisasi_1}, status: verified, id_verifier: null)")

        # Tambah transaksi kedua di Akun A (Februari)
        payload_2 = {
            "id_pagu": id_pagu_a,
            "tanggal_transaksi": "2026-02-10",
            "nomor_dokumen": "DOC-P8-002",
            "uraian_kegiatan": "Pengadaan Konsumsi Februari",
            "jumlah_realisasi": "10000000.00",
            "periode": "Februari 2026",
        }
        res2 = await client.post("/api/v1/realisasi-anggaran/", json=payload_2)
        assert res2.status_code == 201
        created_2 = res2.json()
        id_realisasi_2 = created_2["id_realisasi"]

        # Tambah transaksi ketiga di Akun B (Maret)
        payload_3 = {
            "id_pagu": id_pagu_b,
            "tanggal_transaksi": "2026-03-05",
            "nomor_dokumen": "DOC-P8-003",
            "uraian_kegiatan": "Perjalanan Dinas Monitoring",
            "jumlah_realisasi": "15000000.00",
            "periode": "Maret 2026",
        }
        res3 = await client.post("/api/v1/realisasi-anggaran/", json=payload_3)
        assert res3.status_code == 201
        created_3 = res3.json()
        id_realisasi_3 = created_3["id_realisasi"]

        # ============================================================
        # TEST 2: GET list dengan id_tahun_anggaran
        # ============================================================
        res = await client.get(f"/api/v1/realisasi-anggaran/?id_tahun_anggaran={id_tahun_26}")
        assert res.status_code == 200
        items_26 = res.json()["items"]
        assert all(it["tahun"] == 2026 for it in items_26)
        print(f"[TEST 2 PASSED] GET list with id_tahun_anggaran: all {len(items_26)} items belong to 2026")

        # ============================================================
        # TEST 3: GET list dengan id_akun_anggaran
        # ============================================================
        res = await client.get(f"/api/v1/realisasi-anggaran/?id_akun_anggaran={id_akun_a}")
        assert res.status_code == 200
        items_a = res.json()["items"]
        assert all(it["id_akun_anggaran"] == id_akun_a for it in items_a)
        assert len(items_a) == 2, f"Expected 2 items for Akun A, got {len(items_a)}"
        print(f"[TEST 3 PASSED] GET list with id_akun_anggaran: isolated to Akun A ({len(items_a)} items)")

        # ============================================================
        # TEST 4: GET list dengan id_pagu
        # ============================================================
        res = await client.get(f"/api/v1/realisasi-anggaran/?id_pagu={id_pagu_b}")
        assert res.status_code == 200
        items_pagu_b = res.json()["items"]
        assert len(items_pagu_b) == 1 and items_pagu_b[0]["id_realisasi"] == id_realisasi_3
        print(f"[TEST 4 PASSED] GET list with id_pagu: isolated to Pagu B ({len(items_pagu_b)} items)")

        # Filter bulan check (bulan=1 -> Januari only)
        res_m1 = await client.get(f"/api/v1/realisasi-anggaran/?bulan=1&id_tahun_anggaran={id_tahun_26}")
        assert res_m1.status_code == 200
        m1_items = res_m1.json()["items"]
        assert all(it["tanggal_transaksi"].startswith("2026-01") for it in m1_items)
        print(f"[FILTER BULAN PASSED] GET with bulan=1 returns {len(m1_items)} items for January")

        # ============================================================
        # TEST 5: GET detail valid
        # ============================================================
        res = await client.get(f"/api/v1/realisasi-anggaran/{id_realisasi_1}")
        assert res.status_code == 200
        detail = res.json()
        assert detail["id_realisasi"] == id_realisasi_1
        assert detail["nomor_dokumen"] == "DOC-P8-001"
        assert detail["status"] == "verified"
        assert detail["kode_akun"] == "5281"
        assert detail["tahun"] == 2026
        print(f"[TEST 5 PASSED] GET detail valid: 200 OK with full relations (Akun: {detail['kode_akun']}, TA: {detail['tahun']})")

        # ============================================================
        # TEST 6: GET detail invalid
        # ============================================================
        res = await client.get("/api/v1/realisasi-anggaran/9999999")
        assert res.status_code == 404
        assert "tidak ditemukan" in res.json()["detail"].lower()
        print("[TEST 6 PASSED] GET detail invalid: 404 Not Found")

        # ============================================================
        # TEST 9: Legacy draft/submitted/rejected tetap terbaca
        # ============================================================
        # Insert 1 legacy draft and 1 legacy rejected transaction directly to db
        async with AsyncSessionLocal() as session:
            legacy_draft = RealisasiAnggaran(
                id_pagu=id_pagu_a,
                id_akun_anggaran=id_akun_a,
                id_pegawai=operator.id_pegawai,
                tanggal_transaksi=date(2026, 1, 20),
                nomor_dokumen="DOC-LEGACY-DRAFT",
                uraian_kegiatan="Draft lama belanja",
                jumlah_realisasi=Decimal("5000000.00"),
                status="draft",
            )
            legacy_rejected = RealisasiAnggaran(
                id_pagu=id_pagu_a,
                id_akun_anggaran=id_akun_a,
                id_pegawai=operator.id_pegawai,
                id_verifier=admin.id_pegawai,
                tanggal_transaksi=date(2026, 1, 22),
                nomor_dokumen="DOC-LEGACY-REJ",
                uraian_kegiatan="Belanja ditolak",
                jumlah_realisasi=Decimal("8000000.00"),
                status="rejected",
                catatan_verifikasi="Dokumen tidak lengkap",
            )
            session.add_all([legacy_draft, legacy_rejected])
            await session.commit()
            id_draft = legacy_draft.id_realisasi
            id_rejected = legacy_rejected.id_realisasi

        res_draft = await client.get(f"/api/v1/realisasi-anggaran/{id_draft}")
        assert res_draft.status_code == 200
        assert res_draft.json()["status"] == "draft"

        res_rej = await client.get(f"/api/v1/realisasi-anggaran/{id_rejected}")
        assert res_rej.status_code == 200
        assert res_rej.json()["status"] == "rejected"
        print(f"[TEST 9 PASSED] Legacy status draft ({id_draft}) and rejected ({id_rejected}) dapat dibaca sempurna tanpa corrupt")

        # ============================================================
        # TEST 10: Summary hanya menghitung verified
        # ============================================================
        res_sum = await client.get(f"/api/v1/anggaran/summary?id_tahun_anggaran={id_tahun_26}")
        assert res_sum.status_code == 200
        sum_data = res_sum.json()
        # Verified items: 25M (Akun A) + 10M (Akun A) + 15M (Akun B) = 50M.
        # Draft (5M) and Rejected (8M) must NOT be counted!
        assert Decimal(str(sum_data["total_realisasi_verified"])) == Decimal("50000000.00"), f"Expected 50M, got {sum_data['total_realisasi_verified']}"
        assert sum_data["total_transaksi_verified"] == 3
        assert sum_data["total_transaksi_draft"] >= 1
        assert sum_data["total_transaksi_rejected"] >= 1
        print(f"[TEST 10 PASSED] Summary Macro: Verified=50M (Draft & Rejected TIDAK memotong saldo)")

        # ============================================================
        # TEST 11: Filter tahun + akun
        # ============================================================
        res_comb = await client.get(f"/api/v1/realisasi-anggaran/?id_tahun_anggaran={id_tahun_26}&id_akun_anggaran={id_akun_a}")
        assert res_comb.status_code == 200
        comb_items = res_comb.json()["items"]
        assert all(it["tahun"] == 2026 and it["id_akun_anggaran"] == id_akun_a for it in comb_items)
        print(f"[TEST 11 PASSED] Filter tahun + akun: {len(comb_items)} items match composite hierarchy")

        # ============================================================
        # TEST 12: Overbudget prevention
        # ============================================================
        # Akun A pagu is 100M. Used verified is 35M. Available is 65M.
        # Request 70M -> must be rejected with 400!
        res_ob = await client.post("/api/v1/realisasi-anggaran/", json={
            "id_pagu": id_pagu_a,
            "tanggal_transaksi": "2026-04-01",
            "nomor_dokumen": "DOC-OB-001",
            "uraian_kegiatan": "Overbudget attempt 70M",
            "jumlah_realisasi": "70000000.00",
        })
        assert res_ob.status_code == 400
        assert "melebihi sisa anggaran" in res_ob.json()["detail"].lower()
        print("[TEST 12 PASSED] Overbudget: 400 Bad Request (database saldo tidak berubah)")

        # ============================================================
        # TEST 13: Inactive / Draft Fiscal Year
        # ============================================================
        res_inactive = await client.post("/api/v1/realisasi-anggaran/", json={
            "id_pagu": id_pagu_27,
            "tanggal_transaksi": "2027-01-10",
            "nomor_dokumen": "DOC-INACTIVE-001",
            "uraian_kegiatan": "Transaksi di tahun draft",
            "jumlah_realisasi": "5000000.00",
        })
        assert res_inactive.status_code == 400
        assert "belum aktif" in res_inactive.json()["detail"].lower()
        print("[TEST 13 PASSED] Inactive Year (draft): 400 Bad Request")

        # ============================================================
        # TEST 14: Concurrency test
        # ============================================================
        # Available budget on Akun B is: Pagu 50M - Used 15M = 35M available.
        # Fire two concurrent requests: Request X = 25M, Request Y = 20M (Sum = 45M > 35M).
        req_x = client.post("/api/v1/realisasi-anggaran/", json={
            "id_pagu": id_pagu_b,
            "tanggal_transaksi": "2026-05-01",
            "nomor_dokumen": "DOC-CONC-X",
            "uraian_kegiatan": "Concurrent Request X (25M)",
            "jumlah_realisasi": "25000000.00",
        })
        req_y = client.post("/api/v1/realisasi-anggaran/", json={
            "id_pagu": id_pagu_b,
            "tanggal_transaksi": "2026-05-01",
            "nomor_dokumen": "DOC-CONC-Y",
            "uraian_kegiatan": "Concurrent Request Y (20M)",
            "jumlah_realisasi": "20000000.00",
        })
        res_x, res_y = await asyncio.gather(req_x, req_y)
        statuses = [res_x.status_code, res_y.status_code]
        assert 201 in statuses, "One concurrent request must succeed"
        assert 400 in statuses, "One concurrent request must fail with 400 overbudget"
        print(f"[TEST 14 PASSED] Concurrency Safety: One request succeeded (201), the other safely blocked (400) without over-allocation")

    # Cleanup
    async with AsyncSessionLocal() as session:
        await cleanup_test_data(session)

    print("==================================================")
    print("ALL 14 PHASE 8 TEST SCENARIOS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_phase8_tests())
