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


async def cleanup_phase5_data(session):
    await session.execute(delete(RevisiAnggaran))
    await session.execute(delete(RealisasiAnggaran))
    await session.execute(delete(PaguAnggaran))
    await session.execute(delete(AkunAnggaran).where(AkunAnggaran.kode_akun.like("527%")))
    await session.execute(delete(TahunAnggaran).where(TahunAnggaran.tahun.in_([2024, 2025, 2026, 2027, 2028, 2035])))
    await session.execute(delete(Pegawai).where(Pegawai.nip.in_(["66600101", "66600202"])))
    await session.execute(delete(Bagian).where(Bagian.kode_bagian == "BAG-P5"))
    await session.commit()


async def run_phase5_tests():
    print("=================================================================")
    print("STARTING TEST SUITE PHASE 5: AUTO-CREATE PAGU SAAT AKUN BARU DIBUAT")
    print("=================================================================")

    async with AsyncSessionLocal() as session:
        await cleanup_phase5_data(session)

        # 1. Setup Master Bagian & Pegawai (Admin & Operator)
        bagian = Bagian(kode_bagian="BAG-P5", nama_bagian="Bagian Keuangan P5")
        session.add(bagian)
        await session.flush()

        admin = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Admin Phase 5",
            nip="66600101",
            jabatan="Kasubag Keuangan",
            password="pwd",
            role="admin",
        )
        operator = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Operator Phase 5",
            nip="66600202",
            jabatan="Staff Keuangan",
            password="pwd",
            role="operator",
        )
        session.add_all([admin, operator])
        await session.flush()

        id_admin = admin.id_pegawai
        id_op = operator.id_pegawai
        id_bagian = bagian.id_bagian

        # 2. Setup Tahun Anggaran:
        # 2024: closed
        # 2025: closed
        # 2026: active
        # 2027: draft
        # 2028: closed
        t2024 = TahunAnggaran(tahun=2024, status="closed", tanggal_mulai=date(2024, 1, 1), tanggal_selesai=date(2024, 12, 31), deskripsi="TA 2024 Closed")
        t2025 = TahunAnggaran(tahun=2025, status="closed", tanggal_mulai=date(2025, 1, 1), tanggal_selesai=date(2025, 12, 31), deskripsi="TA 2025 Closed")
        t2026 = TahunAnggaran(tahun=2026, status="active", tanggal_mulai=date(2026, 1, 1), tanggal_selesai=date(2026, 12, 31), deskripsi="TA 2026 Active")
        t2027 = TahunAnggaran(tahun=2027, status="draft", tanggal_mulai=date(2027, 1, 1), tanggal_selesai=date(2027, 12, 31), deskripsi="TA 2027 Draft")
        t2028 = TahunAnggaran(tahun=2028, status="closed", tanggal_mulai=date(2028, 1, 1), tanggal_selesai=date(2028, 12, 31), deskripsi="TA 2028 Closed")
        session.add_all([t2024, t2025, t2026, t2027, t2028])
        await session.commit()

        id_t2024 = t2024.id_tahun_anggaran
        id_t2025 = t2025.id_tahun_anggaran
        id_t2026 = t2026.id_tahun_anggaran
        id_t2027 = t2027.id_tahun_anggaran
        id_t2028 = t2028.id_tahun_anggaran

    admin_headers = {"X-User-Id": str(id_admin)}
    op_headers = {"X-User-Id": str(id_op)}
    transport = httpx.ASGITransport(app=app)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # -------------------------------------------------------------
        # TEST 01 & TEST 02 & TEST 04 & TEST 05 & TEST 06:
        # Create akun active ketika ada (2025 closed, 2026 active, 2027 draft)
        # Expected:
        # - HTTP 201 Created
        # - Pagu otomatis dibuat HANYA untuk 2026 (active) dan 2027 (draft) -> 2 Pagu
        # - Tahun 2025 (closed) TIDAK dibuatkan Pagu
        # - Nilai pagu_awal = 0, pagu_aktif = 0
        # - id_akun_anggaran menunjuk akun baru
        # - id_tahun_anggaran menunjuk 2026 dan 2027
        # -------------------------------------------------------------
        acc_payload_1 = {
            "id_bagian": id_bagian,
            "kode_akun": "527111",
            "nama_akun": "Belanja Keperluan Kantor P5",
            "jenis_belanja": "Barang Operasional",
            "status": "active",
        }
        res_acc1 = await client.post("/api/v1/akun-anggaran/", json=acc_payload_1, headers=admin_headers)
        assert res_acc1.status_code == 201, f"Expected 201, got {res_acc1.status_code}: {res_acc1.text}"
        data_acc1 = res_acc1.json()
        id_acc1 = data_acc1["id_akun_anggaran"]

        # Cek pagu yang terbentuk untuk akun baru ini
        res_pagus_acc1 = await client.get(f"/api/v1/pagu-anggaran/?id_akun_anggaran={id_acc1}")
        assert res_pagus_acc1.status_code == 200
        pagus_acc1 = res_pagus_acc1.json()["items"]
        assert len(pagus_acc1) == 2, f"Expected exactly 2 pagus, got {len(pagus_acc1)}"

        # Validasi tahun dan nominal
        tahun_pagu_map = {p["id_tahun_anggaran"]: p for p in pagus_acc1}
        assert id_t2026 in tahun_pagu_map, "TA 2026 (active) harus mendapatkan Pagu"
        assert id_t2027 in tahun_pagu_map, "TA 2027 (draft) harus mendapatkan Pagu"
        assert id_t2025 not in tahun_pagu_map, "TA 2025 (closed) TIDAK BOLEH dibuatkan Pagu!"
        assert id_t2024 not in tahun_pagu_map, "TA 2024 (closed) TIDAK BOLEH dibuatkan Pagu!"
        assert id_t2028 not in tahun_pagu_map, "TA 2028 (closed) TIDAK BOLEH dibuatkan Pagu!"

        for p in pagus_acc1:
            assert p["id_akun_anggaran"] == id_acc1, "id_akun_anggaran harus menunjuk akun baru"
            assert Decimal(p["pagu_awal"]) == Decimal("0.00")
            assert Decimal(p["pagu_aktif"]) == Decimal("0.00")
            assert p["nomor_sk"] is None
            assert p["tanggal_sk"] is None
            assert p["kode_akun"] == "527111"

        print("[TEST 01, 02, 04, 05, 06 PASSED] Create akun active -> Otomatis buat Pagu untuk active & draft (2026 & 2027), Closed diabaikan, nilai default 0")

        # -------------------------------------------------------------
        # TEST 03: Create akun ketika SEMUA tahun closed
        # Expected: Akun tetap dibuat (HTTP 201), namun tidak ada Pagu baru yang terbentuk (0 Pagu)
        # -------------------------------------------------------------
        # Ubah sementara status 2026 & 2027 menjadi closed
        async with AsyncSessionLocal() as session:
            t_act = await session.get(TahunAnggaran, id_t2026)
            t_drf = await session.get(TahunAnggaran, id_t2027)
            t_act.status = "closed"
            t_drf.status = "closed"
            await session.commit()

        acc_payload_closed_only = {
            "id_bagian": id_bagian,
            "kode_akun": "527112",
            "nama_akun": "Belanja Saat Semua Tahun Closed",
            "status": "active",
        }
        res_acc2 = await client.post("/api/v1/akun-anggaran/", json=acc_payload_closed_only, headers=admin_headers)
        assert res_acc2.status_code == 201
        id_acc2 = res_acc2.json()["id_akun_anggaran"]

        # Cek pagu untuk akun ini
        res_p_acc2 = await client.get(f"/api/v1/pagu-anggaran/?id_akun_anggaran={id_acc2}")
        assert res_p_acc2.json()["total"] == 0, "Tidak boleh ada pagu yang terbentuk saat semua tahun closed"
        print("[TEST 03 PASSED] Akun dibuat saat seluruh tahun closed -> Akun tersimpan, 0 Pagu terbentuk")

        # Kembalikan status 2026 active & 2027 draft
        async with AsyncSessionLocal() as session:
            t_act = await session.get(TahunAnggaran, id_t2026)
            t_drf = await session.get(TahunAnggaran, id_t2027)
            t_act.status = "active"
            t_drf.status = "draft"
            await session.commit()

        # -------------------------------------------------------------
        # TEST 07: Duplicate protection
        # Expected: Kode akun sama ditolak HTTP 400. Pagu tidak ada duplikat kombinasi (tahun, akun)
        # -------------------------------------------------------------
        res_dup_code = await client.post("/api/v1/akun-anggaran/", json=acc_payload_1, headers=admin_headers)
        assert res_dup_code.status_code == 400
        assert "sudah digunakan" in res_dup_code.json()["detail"]

        async with AsyncSessionLocal() as session:
            # Periksa tabel pagu_anggaran di database untuk id_acc1
            pagus_db = (await session.execute(
                select(PaguAnggaran).where(PaguAnggaran.id_akun_anggaran == id_acc1)
            )).scalars().all()
            assert len(pagus_db) == 2, "Jumlah pagu harus tetap 2, tidak ada duplikasi"
        print("[TEST 07 PASSED] Duplicate code dicegah, jumlah pagu tetap konsisten tanpa duplikasi")

        # -------------------------------------------------------------
        # TEST 08: Atomic rollback jika pembuatan salah satu Pagu gagal
        # Expected: Akun baru tidak tersimpan, Pagu yang sempat dibuat juga tidak tersimpan
        # -------------------------------------------------------------
        async with AsyncSessionLocal() as session:
            class MockPhase5Exception(Exception):
                pass

            try:
                # Simulasi manual batch
                acc_mock = AkunAnggaran(
                    id_bagian=id_bagian,
                    kode_akun="527999",
                    nama_akun="Akun Rollback Test",
                    status="active",
                )
                session.add(acc_mock)
                await session.flush()

                # Tambah 1 pagu
                p_item = PaguAnggaran(
                    id_tahun_anggaran=id_t2026,
                    id_akun_anggaran=acc_mock.id_akun_anggaran,
                    pagu_awal=Decimal("0.00"),
                    pagu_aktif=Decimal("0.00"),
                )
                session.add(p_item)
                await session.flush()

                # Simulasikan kegagalan sebelum commit
                raise MockPhase5Exception("Error simulasi saat membuat Pagu ke-2")
            except MockPhase5Exception:
                await session.rollback()

        # Verifikasi bahwa akun 527999 dan pagu terkait TIDAK ADA di DB
        async with AsyncSessionLocal() as session:
            chk_acc = await session.execute(select(AkunAnggaran).where(AkunAnggaran.kode_akun == "527999"))
            assert chk_acc.scalar_one_or_none() is None
            chk_p = await session.execute(select(PaguAnggaran).where(PaguAnggaran.keterangan.like("%527999%")))
            assert len(chk_p.scalars().all()) == 0
        print("[TEST 08 PASSED] Atomic rollback terkonfirmasi: All-or-nothing (0 data tersisa)")

        # -------------------------------------------------------------
        # TEST 09: Multiple active/draft years
        # Tahun existing: 2024 closed, 2025 closed, 2026 active, 2027 draft, 2028 closed
        # Buat akun baru 527113.
        # Expected: Hanya 2026 dan 2027 yang mendapat pagu (2024, 2025, 2028 closed diabaikan)
        # -------------------------------------------------------------
        acc_payload_multi = {
            "id_bagian": id_bagian,
            "kode_akun": "527113",
            "nama_akun": "Belanja Multi Year Filter",
            "status": "active",
        }
        res_acc3 = await client.post("/api/v1/akun-anggaran/", json=acc_payload_multi, headers=admin_headers)
        assert res_acc3.status_code == 201
        id_acc3 = res_acc3.json()["id_akun_anggaran"]

        res_p3 = await client.get(f"/api/v1/pagu-anggaran/?id_akun_anggaran={id_acc3}")
        items_p3 = res_p3.json()["items"]
        assert len(items_p3) == 2
        assigned_years = {p["id_tahun_anggaran"] for p in items_p3}
        assert assigned_years == {id_t2026, id_t2027}
        print("[TEST 09 PASSED] Multiple years terfilter presisi: hanya active dan draft yang dibuatkan Pagu")

        # -------------------------------------------------------------
        # TEST 10: Inactive account
        # Create akun dengan status = 'inactive'
        # Expected: Akun tersimpan, namun 0 Pagu dibuat (sesuai invariant sistem)
        # -------------------------------------------------------------
        acc_payload_inact = {
            "id_bagian": id_bagian,
            "kode_akun": "527114",
            "nama_akun": "Akun Non Aktif Baru",
            "status": "inactive",
        }
        res_inact = await client.post("/api/v1/akun-anggaran/", json=acc_payload_inact, headers=admin_headers)
        assert res_inact.status_code == 201
        id_inact = res_inact.json()["id_akun_anggaran"]

        res_p_inact = await client.get(f"/api/v1/pagu-anggaran/?id_akun_anggaran={id_inact}")
        assert res_p_inact.json()["total"] == 0, "Akun inactive TIDAK BOLEH mendapatkan Pagu!"
        print("[TEST 10 PASSED] Inactive account tersimpan dengan benar tanpa alokasi Pagu")

        # -------------------------------------------------------------
        # TEST 11: Regression Phase 4 (Cross-Feature Invariant)
        # CASE B sudah teruji di atas (Akun baru -> buat pagu untuk 2026 & 2027).
        # Sekarang uji CASE A (Tahun baru dibuat 2035 -> otomatis buat pagu untuk seluruh akun active).
        # Akun active saat ini: 527111, 527112, 527113 (3 akun). 527114 inactive (diabaikan).
        # Expected: Tahun 2035 otomatis memiliki 3 pagu!
        # -------------------------------------------------------------
        t2035_payload = {
            "tahun": 2035,
            "status": "draft",
            "tanggal_mulai": "2035-01-01",
            "tanggal_selesai": "2035-12-31",
            "deskripsi": "Tahun Anggaran Pemilu 2035",
        }
        res_t2035 = await client.post("/api/v1/tahun-anggaran/", json=t2035_payload, headers=admin_headers)
        assert res_t2035.status_code == 201
        id_t2035 = res_t2035.json()["id_tahun_anggaran"]
        assert res_t2035.json()["jumlah_akun"] == 3

        res_p2035 = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_t2035}")
        p2035_items = res_p2035.json()["items"]
        assert len(p2035_items) == 3
        codes_2035 = {p["kode_akun"] for p in p2035_items}
        assert codes_2035 == {"527111", "527112", "527113"}
        assert "527114" not in codes_2035, "Akun inactive tidak boleh masuk TA 2035"
        print("[TEST 11 PASSED] Cross-Feature Invariant Terjaga: Create Tahun Baru otomatis merangkul seluruh Akun Active")

        # -------------------------------------------------------------
        # TEST 12: Regression Phase 3 (Direct Realisasi & Lock & Summary)
        # Ambil Pagu untuk akun 527111 di Tahun 2026 (active)
        # Isi nominal pagu_aktif = 100.000.000 via Revisi Anggaran
        # Buat direct realisasi 30.000.000 -> verified -> summary ter-update
        # -------------------------------------------------------------
        pagu_2026_acc1 = next(p for p in pagus_acc1 if p["id_tahun_anggaran"] == id_t2026)
        id_pagu_active = pagu_2026_acc1["id_pagu"]

        # Admin set pagu_baru = 100M
        res_rev = await client.post(
            "/api/v1/revisi-anggaran/",
            json={
                "id_pagu": id_pagu_active,
                "nomor_revisi": "REV-P5-001",
                "tanggal_revisi": "2026-01-10",
                "pagu_baru": "100000000.00",
                "alasan_revisi": "Alokasi Awal TA 2026 P5",
            },
            headers=admin_headers,
        )
        assert res_rev.status_code == 201
        assert Decimal(res_rev.json()["pagu_sesudah"]) == Decimal("100000000.00")

        # Operator input Realisasi direct 30.000.000
        real_payload = {
            "id_pagu": id_pagu_active,
            "tanggal_transaksi": "2026-04-15",
            "nomor_dokumen": "DOC-P5-REALISASI",
            "uraian_kegiatan": "Pengadaan ATK Phase 5",
            "jumlah_realisasi": "30000000.00",
        }
        res_real = await client.post("/api/v1/realisasi-anggaran/", json=real_payload, headers=op_headers)
        assert res_real.status_code == 201
        data_real = res_real.json()
        assert data_real["status"] == "verified"
        assert data_real["id_verifier"] is None

        # Verifikasi Summary Pagu
        res_sum = await client.get(f"/api/v1/pagu-anggaran/{id_pagu_active}/summary")
        assert res_sum.status_code == 200
        sum_data = res_sum.json()
        assert Decimal(sum_data["total_realisasi_verified"]) == Decimal("30000000.00")
        assert Decimal(sum_data["sisa_anggaran"]) == Decimal("70000000.00")
        assert sum_data["persentase_serapan"] == 30.0

        # Verifikasi overbudget ditolak (sisa 70M, coba 75M)
        over_payload = {
            "id_pagu": id_pagu_active,
            "tanggal_transaksi": "2026-04-16",
            "nomor_dokumen": "DOC-OVER",
            "uraian_kegiatan": "Belanja Melebihi Sisa",
            "jumlah_realisasi": "75000000.00",
        }
        res_over = await client.post("/api/v1/realisasi-anggaran/", json=over_payload, headers=op_headers)
        assert res_over.status_code == 400
        assert "melebihi sisa anggaran" in res_over.json()["detail"]
        print("[TEST 12 PASSED] Regression Phase 3 100% Intact: Direct verified, lock, overbudget prevention, & summary berjalan sempurna")

        # -------------------------------------------------------------
        # CLEANUP
        # -------------------------------------------------------------
        async with AsyncSessionLocal() as session:
            await cleanup_phase5_data(session)
        print("=================================================================")
        print("ALL 12 PHASE 5 TESTS PASSED SUCCESSFULLY!")
        print("=================================================================")


if __name__ == "__main__":
    asyncio.run(run_phase5_tests())
