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

async def cleanup_test_matrix_data(session):
    await session.execute(delete(RevisiAnggaran))
    await session.execute(delete(RealisasiAnggaran))
    await session.execute(delete(PaguAnggaran))
    await session.execute(delete(AkunAnggaran).where(AkunAnggaran.kode_akun.like("529%")))
    await session.execute(delete(TahunAnggaran).where(TahunAnggaran.tahun.in_([2026, 2027, 2028])))
    await session.execute(delete(Pegawai).where(Pegawai.nip.in_(["88800101", "88800202"])))
    await session.execute(delete(Bagian).where(Bagian.kode_bagian == "BAG-TM"))
    await session.commit()

async def run_test_matrix():
    print("=================================================================")
    print("STARTING TEST SUITE MATRIX: DIRECT REALISASI WORKFLOW (TEST 1-15)")
    print("=================================================================")

    async with AsyncSessionLocal() as session:
        await cleanup_test_matrix_data(session)

        # Setup Bagian & Pegawai
        bagian = Bagian(kode_bagian="BAG-TM", nama_bagian="Divisi Test Matrix")
        session.add(bagian)
        await session.flush()

        operator = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Operator Test Matrix",
            nip="88800101",
            jabatan="Staff Keuangan",
            password="pwd",
            role="operator",
        )
        admin = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Admin Test Matrix",
            nip="88800202",
            jabatan="Kasubag Keuangan",
            password="pwd",
            role="admin",
        )
        session.add_all([operator, admin])
        await session.flush()

        # Setup Tahun Anggaran:
        # 2026: active
        # 2027: draft
        # 2028: closed
        ta_active = TahunAnggaran(tahun=2026, status="active", tanggal_mulai=date(2026, 1, 1), tanggal_selesai=date(2026, 12, 31), deskripsi="TA 2026 Active")
        ta_draft = TahunAnggaran(tahun=2027, status="draft", tanggal_mulai=date(2027, 1, 1), tanggal_selesai=date(2027, 12, 31), deskripsi="TA 2027 Draft")
        ta_closed = TahunAnggaran(tahun=2028, status="closed", tanggal_mulai=date(2028, 1, 1), tanggal_selesai=date(2028, 12, 31), deskripsi="TA 2028 Closed")
        session.add_all([ta_active, ta_draft, ta_closed])
        await session.flush()

        # Setup Akun Anggaran
        akun = AkunAnggaran(
            id_bagian=bagian.id_bagian,
            kode_akun="529111",
            nama_akun="Akun Test Realisasi Direct",
            total_pagu=Decimal("100000000.00"),
            status="active",
        )
        session.add(akun)
        await session.flush()

        # Setup Pagu Anggaran
        # Pagu Active 2026: Pagu awal = 100M
        pagu_active = PaguAnggaran(
            id_tahun_anggaran=ta_active.id_tahun_anggaran,
            id_akun_anggaran=akun.id_akun_anggaran,
            pagu_awal=Decimal("100000000.00"),
            pagu_aktif=Decimal("100000000.00"),
        )
        # Pagu Draft 2027
        pagu_draft = PaguAnggaran(
            id_tahun_anggaran=ta_draft.id_tahun_anggaran,
            id_akun_anggaran=akun.id_akun_anggaran,
            pagu_awal=Decimal("100000000.00"),
            pagu_aktif=Decimal("100000000.00"),
        )
        # Pagu Closed 2028
        pagu_closed = PaguAnggaran(
            id_tahun_anggaran=ta_closed.id_tahun_anggaran,
            id_akun_anggaran=akun.id_akun_anggaran,
            pagu_awal=Decimal("100000000.00"),
            pagu_aktif=Decimal("100000000.00"),
        )
        session.add_all([pagu_active, pagu_draft, pagu_closed])
        await session.commit()

        id_pagu_active = pagu_active.id_pagu
        id_pagu_draft = pagu_draft.id_pagu
        id_pagu_closed = pagu_closed.id_pagu
        id_op = operator.id_pegawai
        id_admin = admin.id_pegawai

    op_headers = {"X-User-Id": str(id_op)}
    admin_headers = {"X-User-Id": str(id_admin)}

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:

        # -------------------------------------------------------------
        # TEST 01 & TEST 09 & TEST 10: Create realisasi valid
        # Expected: HTTP 201, status = verified, langsung tanpa submit & tanpa verify admin
        # -------------------------------------------------------------
        p1 = {
            "id_pagu": id_pagu_active,
            "tanggal_transaksi": "2026-03-01",
            "nomor_dokumen": "DOC-TM-01",
            "uraian_kegiatan": "Pengadaan Konsumsi Test Direct",
            "jumlah_realisasi": "25000000.00",
            "periode": "Maret 2026",
        }
        res1 = await client.post("/api/v1/realisasi-anggaran/", json=p1, headers=op_headers)
        assert res1.status_code == 201, f"Expected 201, got {res1.status_code}: {res1.text}"
        data1 = res1.json()
        assert data1["status"] == "verified", f"Expected verified, got {data1['status']}"
        assert data1["id_verifier"] is None, "id_verifier should be None (auto system validation)"
        assert data1["verified_at"] is not None
        print("[TEST 01, 09, 10 PASSED] Realisasi dibuat valid -> HTTP 201, status = verified, no manual submit/verify")

        # -------------------------------------------------------------
        # TEST 02 & TEST 11: Realisasi dengan jumlah <= sisa anggaran masuk summary
        # -------------------------------------------------------------
        sum_res = await client.get(f"/api/v1/pagu-anggaran/{id_pagu_active}/summary")
        assert sum_res.status_code == 200
        sum_data = sum_res.json()
        assert Decimal(sum_data["total_realisasi_verified"]) == Decimal("25000000.00")
        assert Decimal(sum_data["sisa_anggaran"]) == Decimal("75000000.00")
        assert sum_data["persentase_serapan"] == 25.0
        print("[TEST 02, 11 PASSED] Realisasi <= sisa berhasil, summary pagu langsung ter-update (Sisa: 75M)")

        # -------------------------------------------------------------
        # TEST 03: Create realisasi dengan jumlah > sisa anggaran (sisa = 75M, request 80M)
        # Expected: HTTP 400, ditolak, tidak ada record baru
        # -------------------------------------------------------------
        p_over = {
            "id_pagu": id_pagu_active,
            "tanggal_transaksi": "2026-03-02",
            "nomor_dokumen": "DOC-OVER",
            "uraian_kegiatan": "Pengadaan Melebihi Sisa",
            "jumlah_realisasi": "80000000.00",
        }
        res_over = await client.post("/api/v1/realisasi-anggaran/", json=p_over, headers=op_headers)
        assert res_over.status_code == 400
        assert "melebihi sisa anggaran" in res_over.json()["detail"]
        print("[TEST 03 PASSED] Realisasi > sisa anggaran ditolak dengan HTTP 400")

        # -------------------------------------------------------------
        # TEST 04: Create realisasi pada tahun ACTIVE
        # Expected: Berhasil (diuji juga dengan transaksi kedua 15M, sisa jadi 60M)
        # -------------------------------------------------------------
        p_active = {
            "id_pagu": id_pagu_active,
            "tanggal_transaksi": "2026-03-03",
            "nomor_dokumen": "DOC-ACTIVE-02",
            "uraian_kegiatan": "Belanja ATK Active Year",
            "jumlah_realisasi": "15000000.00",
        }
        res_act = await client.post("/api/v1/realisasi-anggaran/", json=p_active, headers=op_headers)
        assert res_act.status_code == 201
        assert res_act.json()["status"] == "verified"
        print("[TEST 04 PASSED] Realisasi pada tahun ACTIVE diterima dan langsung verified")

        # -------------------------------------------------------------
        # TEST 05: Create realisasi pada tahun DRAFT
        # Expected: Ditolak (HTTP 400)
        # -------------------------------------------------------------
        p_draft = {
            "id_pagu": id_pagu_draft,
            "tanggal_transaksi": "2027-01-10",
            "nomor_dokumen": "DOC-DRAFT",
            "uraian_kegiatan": "Belanja Tahun Draft",
            "jumlah_realisasi": "5000000.00",
        }
        res_draft = await client.post("/api/v1/realisasi-anggaran/", json=p_draft, headers=op_headers)
        assert res_draft.status_code == 400
        assert "belum aktif (draft)" in res_draft.json()["detail"]
        print("[TEST 05 PASSED] Realisasi pada tahun DRAFT ditolak dengan HTTP 400")

        # -------------------------------------------------------------
        # TEST 06: Create realisasi pada tahun CLOSED
        # Expected: Ditolak (HTTP 400)
        # -------------------------------------------------------------
        p_closed = {
            "id_pagu": id_pagu_closed,
            "tanggal_transaksi": "2028-01-10",
            "nomor_dokumen": "DOC-CLOSED",
            "uraian_kegiatan": "Belanja Tahun Closed",
            "jumlah_realisasi": "5000000.00",
        }
        res_closed = await client.post("/api/v1/realisasi-anggaran/", json=p_closed, headers=op_headers)
        assert res_closed.status_code == 400
        assert "sudah ditutup (closed)" in res_closed.json()["detail"]
        print("[TEST 06 PASSED] Realisasi pada tahun CLOSED ditolak dengan HTTP 400")

        # -------------------------------------------------------------
        # TEST 07: Create realisasi dengan Pagu yang tidak valid
        # Expected: Ditolak (HTTP 404)
        # -------------------------------------------------------------
        p_invalid_pagu = {
            "id_pagu": 999999,
            "tanggal_transaksi": "2026-03-05",
            "nomor_dokumen": "DOC-NOTFOUND",
            "uraian_kegiatan": "Belanja Pagu Palsu",
            "jumlah_realisasi": "1000000.00",
        }
        res_inv = await client.post("/api/v1/realisasi-anggaran/", json=p_invalid_pagu, headers=op_headers)
        assert res_inv.status_code == 404
        print("[TEST 07 PASSED] Realisasi dengan ID pagu tidak ditemukan ditolak HTTP 404")

        # -------------------------------------------------------------
        # TEST 08: Relasi akun & tahun ter-resolve otomatis dan konsisten dari Pagu
        # Expected: id_akun_anggaran dan tahun pada response match dengan Pagu
        # -------------------------------------------------------------
        res_get = await client.get(f"/api/v1/realisasi-anggaran/{data1['id_realisasi']}")
        assert res_get.status_code == 200
        d_get = res_get.json()
        assert d_get["id_akun_anggaran"] == akun.id_akun_anggaran
        assert d_get["tahun"] == 2026
        print("[TEST 08 PASSED] Akun dan tahun terikat secara konsisten pada Pagu")

        # Verify remaining before concurrency test
        chk_res = await client.get(f"/api/v1/pagu-anggaran/{id_pagu_active}/summary")
        chk_data = chk_res.json()
        print(f"DEBUG BEFORE CONCURRENCY: pagu_aktif={chk_data['pagu_aktif']}, verified={chk_data['total_realisasi_verified']}, sisa={chk_data['sisa_anggaran']}")

        req_c1 = {
            "id_pagu": id_pagu_active,
            "tanggal_transaksi": "2026-03-10",
            "nomor_dokumen": "DOC-CONCUR-1",
            "uraian_kegiatan": "Belanja Konkurensi 1",
            "jumlah_realisasi": "40000000.00",
        }
        req_c2 = {
            "id_pagu": id_pagu_active,
            "tanggal_transaksi": "2026-03-10",
            "nomor_dokumen": "DOC-CONCUR-2",
            "uraian_kegiatan": "Belanja Konkurensi 2",
            "jumlah_realisasi": "40000000.00",
        }
        # Concurrency simulation with two distinct concurrent client sessions
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client1, \
                   httpx.AsyncClient(transport=transport, base_url="http://testserver") as client2:
            results = await asyncio.gather(
                client1.post("/api/v1/realisasi-anggaran/", json=req_c1, headers=op_headers),
                client2.post("/api/v1/realisasi-anggaran/", json=req_c2, headers=op_headers),
            )
        status_codes = [r.status_code for r in results]
        print(f"DEBUG CONCURRENCY: status_codes={status_codes}")
        for r in results:
            print(f"DEBUG CONCURRENCY response: status={r.status_code}, body={r.text}")
        assert 201 in status_codes, "Salah satu request harus berhasil"
        assert 400 in status_codes, "Salah satu request harus ditolak karena melebihi sisa"
        print(f"[TEST 12 PASSED] Concurrency Safety Confirmed: {status_codes}. No overbudget occurred!")

        # -------------------------------------------------------------
        # TEST 13 & 14 & 15: Backward Compatibility:
        # Menambahkan data lama berstatus 'draft', 'submitted', 'rejected', 'verified' langsung ke DB
        # Expected:
        # - Semua data lama dapat dibaca via GET list
        # - Hanya data verified yang masuk summary
        # - Data draft, submitted, rejected TIDAK masuk summary
        # -------------------------------------------------------------
        async with AsyncSessionLocal() as session:
            legacy_draft = RealisasiAnggaran(
                id_pagu=id_pagu_active,
                id_akun_anggaran=akun.id_akun_anggaran,
                id_pegawai=id_op,
                tanggal_transaksi=date(2026, 3, 11),
                nomor_dokumen="LEGACY-DRAFT",
                uraian_kegiatan="Transaksi Lama Draft",
                jumlah_realisasi=Decimal("5000000.00"),
                status="draft",
            )
            legacy_submitted = RealisasiAnggaran(
                id_pagu=id_pagu_active,
                id_akun_anggaran=akun.id_akun_anggaran,
                id_pegawai=id_op,
                tanggal_transaksi=date(2026, 3, 12),
                nomor_dokumen="LEGACY-SUBMITTED",
                uraian_kegiatan="Transaksi Lama Submitted",
                jumlah_realisasi=Decimal("7000000.00"),
                status="submitted",
            )
            legacy_rejected = RealisasiAnggaran(
                id_pagu=id_pagu_active,
                id_akun_anggaran=akun.id_akun_anggaran,
                id_pegawai=id_op,
                tanggal_transaksi=date(2026, 3, 13),
                nomor_dokumen="LEGACY-REJECTED",
                uraian_kegiatan="Transaksi Lama Rejected",
                jumlah_realisasi=Decimal("9000000.00"),
                status="rejected",
                catatan_verifikasi="Ditolak admin",
            )
            session.add_all([legacy_draft, legacy_submitted, legacy_rejected])
            await session.commit()

        # TEST 13: List data memuat semua status
        res_list = await client.get(f"/api/v1/realisasi-anggaran/?id_pagu={id_pagu_active}&limit=100")
        assert res_list.status_code == 200
        items = res_list.json()["items"]
        statuses = {it["status"] for it in items}
        assert "verified" in statuses
        assert "draft" in statuses
        assert "submitted" in statuses
        assert "rejected" in statuses
        print(f"[TEST 13 PASSED] Data realisasi lama dengan beragam status tetap dapat dibaca: {statuses}")

        # TEST 14 & TEST 15: Cek Summary makro dan pagu
        # Total verified sejauh ini: 25M (Test 1) + 15M (Test 4) + 40M (Test 12 salah satu yg lolos) = 80M.
        # Legacy draft (5M), submitted (7M), rejected (9M) TIDAK boleh masuk ke total_realisasi_verified!
        res_macro = await client.get("/api/v1/anggaran/summary?id_tahun_anggaran=" + str(ta_active.id_tahun_anggaran))
        assert res_macro.status_code == 200
        macro_data = res_macro.json()
        assert Decimal(macro_data["total_realisasi_verified"]) == Decimal("80000000.00")
        assert Decimal(macro_data["total_sisa_anggaran"]) == Decimal("20000000.00")
        assert macro_data["persentase_serapan"] == 80.0
        assert macro_data["total_transaksi_draft"] >= 1
        assert macro_data["total_transaksi_submitted"] >= 1
        assert macro_data["total_transaksi_rejected"] >= 1
        assert macro_data["total_transaksi_verified"] == 3
        print(f"[TEST 14 & 15 PASSED] Summary Macro: Verified={macro_data['total_realisasi_verified']} (80M), Sisa={macro_data['total_sisa_anggaran']} (20M). Draft/Submitted/Rejected TIDAK mempengaruhi serapan!")

        # Final Cleanup
        async with AsyncSessionLocal() as session:
            await cleanup_test_matrix_data(session)

    print("=================================================================")
    print("ALL 15 TEST SUITE MATRIX CASES PASSED SUCCESSFULLY!")
    print("=================================================================")

if __name__ == "__main__":
    asyncio.run(run_test_matrix())
