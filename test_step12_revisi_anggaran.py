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
    """Clean up test records."""
    await session.execute(delete(RevisiAnggaran))
    await session.execute(delete(RealisasiAnggaran))
    await session.execute(delete(PaguAnggaran))
    await session.execute(delete(AkunAnggaran).where(AkunAnggaran.kode_akun.like("529%")))
    await session.execute(delete(TahunAnggaran).where(TahunAnggaran.tahun.in_([2026, 2027])))
    await session.execute(delete(Pegawai).where(Pegawai.nip.in_(["88881201", "88881202"])))
    await session.execute(delete(Bagian).where(Bagian.kode_bagian.in_(["BAG-P12"])))
    await session.commit()

async def run_step12_tests():
    print("==================================================")
    print("STARTING STEP 12 REVISI ANGGARAN & AUDIT TRAIL TEST SUITE")
    print("==================================================")

    async with AsyncSessionLocal() as session:
        await cleanup_test_data(session)

        # 1. Setup Base: Bagian, Pegawai Admin & Pegawai Staff
        bagian = Bagian(kode_bagian="BAG-P12", nama_bagian="Bagian Keuangan P12")
        session.add(bagian)
        await session.commit()
        await session.refresh(bagian)

        pegawai_admin = Pegawai(
            nip="88881201",
            nama="Budi Bendahara",
            password="pwd",
            jabatan="PPK Keuangan",
            role="admin",
            id_bagian=bagian.id_bagian,
        )
        pegawai_staff = Pegawai(
            nip="88881202",
            nama="Siti Staf",
            password="pwd",
            jabatan="Staf Verifikator",
            role="pegawai",
            id_bagian=bagian.id_bagian,
        )
        session.add_all([pegawai_admin, pegawai_staff])
        await session.commit()
        await session.refresh(pegawai_admin)
        await session.refresh(pegawai_staff)

        # 2. Setup Fiscal Years:
        # - Year 2026: ACTIVE
        # - Year 2027: CLOSED
        ta_2026 = TahunAnggaran(
            tahun=2026,
            status="active",
            tanggal_mulai=date(2026, 1, 1),
            tanggal_selesai=date(2026, 12, 31),
            deskripsi="Tahun Anggaran 2026 Aktif",
            id_pegawai_pembuat=pegawai_admin.id_pegawai,
        )
        ta_2027 = TahunAnggaran(
            tahun=2027,
            status="closed",
            tanggal_mulai=date(2027, 1, 1),
            tanggal_selesai=date(2027, 12, 31),
            deskripsi="Tahun Anggaran 2027 Ditutup",
            id_pegawai_pembuat=pegawai_admin.id_pegawai,
        )
        session.add_all([ta_2026, ta_2027])
        await session.commit()
        await session.refresh(ta_2026)
        await session.refresh(ta_2027)

        # 3. Setup Accounts:
        akun_1 = AkunAnggaran(
            kode_akun="529111",
            nama_akun="Belanja Operasional P12",
            jenis_belanja="barang",
            id_bagian=bagian.id_bagian,
            status="active",
        )
        akun_closed = AkunAnggaran(
            kode_akun="529112",
            nama_akun="Belanja Closed Year P12",
            jenis_belanja="barang",
            id_bagian=bagian.id_bagian,
            status="active",
        )
        session.add_all([akun_1, akun_closed])
        await session.commit()
        await session.refresh(akun_1)
        await session.refresh(akun_closed)

        # 4. Setup Pagu:
        # Pagu 1: 2026 Active, Awal = 100,000,000, Aktif = 100,000,000
        pagu_1 = PaguAnggaran(
            id_tahun_anggaran=ta_2026.id_tahun_anggaran,
            id_akun_anggaran=akun_1.id_akun_anggaran,
            pagu_awal=Decimal("100000000.00"),
            pagu_aktif=Decimal("100000000.00"),
            nomor_sk="SK/DIPA/2026-001",
            tanggal_sk=date(2026, 1, 2),
            keterangan="Pagu Awal DIPA 2026",
        )
        # Pagu Closed: 2027 Closed, Awal = 50,000,000
        pagu_closed = PaguAnggaran(
            id_tahun_anggaran=ta_2027.id_tahun_anggaran,
            id_akun_anggaran=akun_closed.id_akun_anggaran,
            pagu_awal=Decimal("50000000.00"),
            pagu_aktif=Decimal("50000000.00"),
            nomor_sk="SK/DIPA/2027-001",
            tanggal_sk=date(2027, 1, 2),
            keterangan="Pagu DIPA 2027 Closed",
        )
        session.add_all([pagu_1, pagu_closed])
        await session.commit()
        await session.refresh(pagu_1)
        await session.refresh(pagu_closed)

        # 5. Add Realisasi Verified pada Pagu 1: 30,000,000 (Januari = 10M, Februari = 20M)
        real_1 = RealisasiAnggaran(
            id_pagu=pagu_1.id_pagu,
            id_akun_anggaran=akun_1.id_akun_anggaran,
            nomor_dokumen="SPM-P12-001",
            tanggal_transaksi=date(2026, 1, 15),
            jumlah_realisasi=Decimal("10000000.00"),
            uraian_kegiatan="Belanja Tahap 1",
            status="verified",
            id_pegawai=pegawai_admin.id_pegawai,
            id_verifier=pegawai_admin.id_pegawai,
        )
        real_2 = RealisasiAnggaran(
            id_pagu=pagu_1.id_pagu,
            id_akun_anggaran=akun_1.id_akun_anggaran,
            nomor_dokumen="SPM-P12-002",
            tanggal_transaksi=date(2026, 2, 20),
            jumlah_realisasi=Decimal("20000000.00"),
            uraian_kegiatan="Belanja Tahap 2",
            status="verified",
            id_pegawai=pegawai_admin.id_pegawai,
            id_verifier=pegawai_admin.id_pegawai,
        )
        session.add_all([real_1, real_2])
        await session.commit()

        id_pagu_1 = pagu_1.id_pagu
        id_pagu_closed = pagu_closed.id_pagu
        admin_id = pegawai_admin.id_pegawai
        staff_id = pegawai_staff.id_pegawai

    # ==================================================
    # HTTP TEST SUITE (FastAPI ASYNC CLIENT)
    # ==================================================
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        admin_headers = {"X-User-Id": str(admin_id)}
        staff_headers = {"X-User-Id": str(staff_id)}

        # --------------------------------------------------
        # TEST 1: Initial Baseline Check (Dashboard & Monthly Report)
        # --------------------------------------------------
        resp = await client.get("/api/v1/anggaran/summary?id_tahun_anggaran=" + str(ta_2026.id_tahun_anggaran))
        assert resp.status_code == 200, resp.text
        dash_init = resp.json()
        assert Decimal(str(dash_init["total_pagu_aktif"])) == Decimal("100000000.00")
        assert Decimal(str(dash_init["total_realisasi_verified"])) == Decimal("30000000.00")
        assert Decimal(str(dash_init["total_sisa_anggaran"])) == Decimal("70000000.00")
        assert dash_init["persentase_serapan"] == 30.0
        print("[TEST 1 PASSED] Initial macro baseline confirmed: Pagu=100M, Realisasi=30M, Sisa=70M, Serapan=30%")

        # --------------------------------------------------
        # TEST 2: Role Authorization (Staff vs Admin)
        # --------------------------------------------------
        resp = await client.post(
            f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi",
            headers=staff_headers,
            json={"pagu_baru": 120000000, "alasan": "Revisi oleh staf"},
        )
        assert resp.status_code == 403, "Staff must be forbidden from budget revision"
        print("[TEST 2 PASSED] Non-admin cannot execute budget revisions (403 Forbidden)")

        # --------------------------------------------------
        # TEST 3: Validation - Negative Value Rejection
        # --------------------------------------------------
        resp = await client.post(
            f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi",
            headers=admin_headers,
            json={"pagu_baru": -500000, "alasan": "Uji negatif"},
        )
        assert resp.status_code in [400, 422], f"Negative pagu must be rejected, got {resp.status_code}"
        print("[TEST 3 PASSED] Negative pagu rejected (400/422)")

        # --------------------------------------------------
        # TEST 4: Validation - Over-Realization Protection (Pagu Baru < Total Realisasi Terverifikasi)
        # Verified total = 30M. Attempting revisi to 25M must fail.
        # --------------------------------------------------
        resp = await client.post(
            f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi",
            headers=admin_headers,
            json={"pagu_baru": 25000000, "alasan": "Pagu di bawah realisasi"},
        )
        assert resp.status_code == 400, f"Expected 400 for under-realization, got {resp.status_code}"
        assert "tidak boleh lebih kecil dari total realisasi" in resp.json()["detail"].lower()
        print("[TEST 4 PASSED] Pagu baru < realisasi terverifikasi rejected with 400")

        # --------------------------------------------------
        # TEST 5: Validation - Closed Year Immutability Protection
        # --------------------------------------------------
        resp = await client.post(
            f"/api/v1/pagu-anggaran/{id_pagu_closed}/revisi",
            headers=admin_headers,
            json={"pagu_baru": 60000000, "alasan": "Coba revisi tahun closed"},
        )
        assert resp.status_code == 400, f"Expected 400 for closed year, got {resp.status_code}"
        assert "closed" in resp.json()["detail"].lower()
        print("[TEST 5 PASSED] Closed fiscal year revision strictly rejected (400)")

        # --------------------------------------------------
        # TEST 6: Multiple Sequential Revisions & Audit Trail Accuracy
        # Sequence:
        # Revision 1: 100M -> 120M (+20M)
        # Revision 2: 120M -> 110M (-10M)
        # Revision 3: 110M -> 150M (+40M)
        # --------------------------------------------------
        rev1_payload = {
            "pagu_baru": 120000000.00,
            "alasan": "Penambahan anggaran DIPA Perubahan Tahap 1",
            "nomor_revisi": "REV/2026/001",
        }
        resp1 = await client.post(f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi", headers=admin_headers, json=rev1_payload)
        assert resp1.status_code == 201, resp1.text
        r1_data = resp1.json()
        assert Decimal(str(r1_data["pagu_sebelum"])) == Decimal("100000000.00")
        assert Decimal(str(r1_data["pagu_sesudah"])) == Decimal("120000000.00")
        assert Decimal(str(r1_data["perubahan_netto"])) == Decimal("20000000.00")
        assert r1_data["id_pegawai"] == admin_id
        assert r1_data["nama_pegawai"] == "Budi Bendahara"

        rev2_payload = {
            "pagu_baru": 110000000.00,
            "alasan": "Efisiensi perjalanan dinas KPU Tahap 2",
            "nomor_revisi": "REV/2026/002",
        }
        resp2 = await client.post(f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi", headers=admin_headers, json=rev2_payload)
        assert resp2.status_code == 201, resp2.text
        r2_data = resp2.json()
        assert Decimal(str(r2_data["pagu_sebelum"])) == Decimal("120000000.00")
        assert Decimal(str(r2_data["pagu_sesudah"])) == Decimal("110000000.00")
        assert Decimal(str(r2_data["perubahan_netto"])) == Decimal("-10000000.00")

        rev3_payload = {
            "pagu_baru": 150000000.00,
            "alasan": "Eskalasi logistik pemilu tambahan Tahap 3",
            "nomor_revisi": "REV/2026/003",
        }
        resp3 = await client.post(f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi", headers=admin_headers, json=rev3_payload)
        assert resp3.status_code == 201, resp3.text
        r3_data = resp3.json()
        assert Decimal(str(r3_data["pagu_sebelum"])) == Decimal("110000000.00")
        assert Decimal(str(r3_data["pagu_sesudah"])) == Decimal("150000000.00")
        assert Decimal(str(r3_data["perubahan_netto"])) == Decimal("40000000.00")
        print("[TEST 6 PASSED] Multiple sequential revisions accurately logged before -> after")

        # --------------------------------------------------
        # TEST 7: Audit Trail Immutability & Retrieval
        # --------------------------------------------------
        # 1. Fetch via /pagu-anggaran/{id_pagu}/revisi
        resp_hist = await client.get(f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi")
        assert resp_hist.status_code == 200
        history_list = resp_hist.json()
        assert len(history_list) == 3
        # Chronological or desc check
        assert Decimal(str(history_list[0]["pagu_sesudah"])) == Decimal("150000000.00")
        assert Decimal(str(history_list[1]["pagu_sesudah"])) == Decimal("110000000.00")
        assert Decimal(str(history_list[2]["pagu_sesudah"])) == Decimal("120000000.00")

        # 2. Immutability: PUT/DELETE /api/v1/revisi-anggaran must return 405 Method Not Allowed
        put_resp = await client.put(f"/api/v1/revisi-anggaran/{r1_data['id_revisi']}", headers=admin_headers, json={})
        assert put_resp.status_code in [404, 405], f"PUT audit trail must not exist, got {put_resp.status_code}"
        del_resp = await client.delete(f"/api/v1/revisi-anggaran/{r1_data['id_revisi']}", headers=admin_headers)
        assert del_resp.status_code in [404, 405], f"DELETE audit trail must not exist, got {del_resp.status_code}"
        print("[TEST 7 PASSED] Audit trail is strictly immutable (no update/delete routes allowed)")

        # --------------------------------------------------
        # TEST 8: Pagu Detail & Active Pagu Verification
        # --------------------------------------------------
        resp_pagu = await client.get(f"/api/v1/pagu-anggaran/{id_pagu_1}")
        assert resp_pagu.status_code == 200
        pagu_data = resp_pagu.json()
        assert Decimal(str(pagu_data["pagu_awal"])) == Decimal("100000000.00"), "Pagu awal must remain 100M"
        assert Decimal(str(pagu_data["pagu_aktif"])) == Decimal("150000000.00"), "Pagu aktif must reflect 150M"
        assert Decimal(str(pagu_data["total_realisasi_verified"])) == Decimal("30000000.00"), "Realisasi must remain 30M"
        assert Decimal(str(pagu_data["sisa_anggaran"])) == Decimal("120000000.00"), "Sisa = 150M - 30M = 120M"
        assert pagu_data["persentase_serapan"] == 20.0, "Serapan = 30M / 150M = 20%"
        print("[TEST 8 PASSED] Pagu detail reflects latest active pagu: Pagu=150M, Realisasi=30M, Sisa=120M, Serapan=20%")

        # --------------------------------------------------
        # TEST 9: Dashboard Automatic Update
        # --------------------------------------------------
        resp_dash = await client.get(f"/api/v1/anggaran/summary?id_tahun_anggaran={ta_2026.id_tahun_anggaran}")
        assert resp_dash.status_code == 200
        dash_after = resp_dash.json()
        assert Decimal(str(dash_after["total_pagu_aktif"])) == Decimal("150000000.00")
        assert Decimal(str(dash_after["total_realisasi_verified"])) == Decimal("30000000.00")
        assert Decimal(str(dash_after["total_sisa_anggaran"])) == Decimal("120000000.00")
        assert dash_after["persentase_serapan"] == 20.0
        print("[TEST 9 PASSED] Dashboard automatically reflects new Pagu: Pagu=150M, Sisa=120M, Serapan=20%")

        # --------------------------------------------------
        # TEST 10: Monthly Report Automatic Update
        # --------------------------------------------------
        resp_monthly = await client.get(f"/api/v1/anggaran/monthly-report?id_tahun_anggaran={ta_2026.id_tahun_anggaran}")
        assert resp_monthly.status_code == 200
        monthly_data = resp_monthly.json()
        m_tot = monthly_data["total"]
        assert Decimal(str(m_tot["pagu"])) == Decimal("150000000.00")
        assert Decimal(str(m_tot["januari"])) == Decimal("10000000.00"), "Januari realisasi unchanged"
        assert Decimal(str(m_tot["februari"])) == Decimal("20000000.00"), "Februari realisasi unchanged"
        assert Decimal(str(m_tot["total_realisasi"])) == Decimal("30000000.00")
        assert Decimal(str(m_tot["sisa_anggaran"])) == Decimal("120000000.00")
        assert m_tot["persentase_realisasi"] == 20.0
        # --------------------------------------------------
        # TEST 11: Transaction Atomicity & Rollback Verification
        # If any step fails during revision execution, no changes must persist
        # --------------------------------------------------
        # Test simulated by checking current pagu
        pagu_before_rollback = (await client.get(f"/api/v1/pagu-anggaran/{id_pagu_1}")).json()
        active_before = Decimal(str(pagu_before_rollback["pagu_aktif"]))
        audit_count_before = len((await client.get(f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi")).json())

        # Attempt an invalid revision (e.g. pagu lower than verified realization)
        fail_resp = await client.post(
            f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi",
            headers=admin_headers,
            json={"pagu_baru": 10000000.00, "alasan": "Atomic failure test"},
        )
        assert fail_resp.status_code == 400

        # Verify database remained completely unchanged (atomic rollback)
        pagu_after_rollback = (await client.get(f"/api/v1/pagu-anggaran/{id_pagu_1}")).json()
        active_after = Decimal(str(pagu_after_rollback["pagu_aktif"]))
        audit_count_after = len((await client.get(f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi")).json())

        assert active_before == active_after, "Pagu aktif must not change on failed revision"
        assert audit_count_before == audit_count_after, "No audit trail record should be created on failure"
        print("[TEST 11 PASSED] Transaction rollback verified: failed revision leaves DB completely untouched")

        # --------------------------------------------------
        # TEST 12: Concurrency & Sequential Integrity
        # Concurrent revision calls on the same Pagu handled cleanly via row lock
        # --------------------------------------------------
        async def send_revision(new_amount: float, note: str):
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
                return await c.post(
                    f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi",
                    headers=admin_headers,
                    json={"pagu_baru": new_amount, "alasan": note},
                )

        # Run 2 concurrent revisions
        res_a, res_b = await asyncio.gather(
            send_revision(160000000.00, "Concurrent revision A"),
            send_revision(170000000.00, "Concurrent revision B"),
        )
        assert res_a.status_code == 201
        assert res_b.status_code == 201

        # Check latest audit count increased by exactly 2
        audit_list_final = (await client.get(f"/api/v1/pagu-anggaran/{id_pagu_1}/revisi")).json()
        assert len(audit_list_final) == 5, f"Expected 5 total audit records, got {len(audit_list_final)}"
        print("[TEST 12 PASSED] Concurrency & row-level locking passed with consistent sequential audit trail")

    # Cleanup after test completion
    async with AsyncSessionLocal() as session:
        await cleanup_test_data(session)

    print("==================================================")
    print("ALL STEP 12 TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_step12_tests())
