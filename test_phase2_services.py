import asyncio
from datetime import date, datetime
from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy import select

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
from app.schemas.anggaran import (
    TahunAnggaranCreate,
    TahunAnggaranUpdate,
    AkunAnggaranCreate,
    PaguAnggaranCreate,
    RevisiAnggaranCreate,
    RealisasiAnggaranCreateDraft,
    RealisasiAnggaranUpdateDraft,
    RealisasiAnggaranVerify,
    RealisasiAnggaranReject,
)
from app.services.anggaran import (
    calculate_budget_summary,
    tahun_anggaran,
    akun_anggaran,
    pagu_anggaran,
    revisi_anggaran,
    realisasi_anggaran,
)

async def run_phase2_service_tests():
    print("==================================================")
    print("STARTING PHASE 2 AUTOMATED SERVICE & BUSINESS TESTS")
    print("==================================================")

    async with AsyncSessionLocal() as session:
        # Pre-cleanup to guarantee idempotent test runs
        from sqlalchemy import delete
        await session.execute(delete(RevisiAnggaran))
        await session.execute(delete(RealisasiAnggaran))
        await session.execute(delete(PaguAnggaran))
        # Find id_bagian for BAG-TEST if exists
        bg_stmt = select(Bagian.id_bagian).where(Bagian.kode_bagian == "BAG-TEST")
        bg_res = await session.execute(bg_stmt)
        bg_ids = bg_res.scalars().all()
        if bg_ids:
            await session.execute(delete(AkunAnggaran).where(AkunAnggaran.id_bagian.in_(bg_ids)))
            await session.execute(delete(Pegawai).where(Pegawai.id_bagian.in_(bg_ids)))
        await session.execute(delete(AkunAnggaran).where(AkunAnggaran.kode_akun == "521211"))
        await session.execute(delete(TahunAnggaran).where(TahunAnggaran.tahun.in_([2026, 2025, 2024])))
        await session.execute(delete(Pegawai).where(Pegawai.nip.in_(["199001012015011001", "198202022008012002"])))
        await session.execute(delete(Bagian).where(Bagian.kode_bagian == "BAG-TEST"))
        await session.commit()

        # Setup Master Bagian & Pegawai
        bagian = Bagian(kode_bagian="BAG-TEST", nama_bagian="Divisi Perencanaan dan Logistik")
        session.add(bagian)
        await session.flush()

        operator = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Operator Test",
            nip="199001012015011001",
            jabatan="Staff Perencanaan",
            password="pwd",
            role="operator",
        )
        verifier = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Verifier Test",
            nip="198202022008012002",
            jabatan="Kepala Subbagian",
            password="pwd",
            role="admin",
        )
        session.add_all([operator, verifier])
        await session.commit()
        await session.refresh(operator)
        await session.refresh(verifier)
        print("[SETUP] Created test Bagian and Pegawai (Operator & Verifier)")

        # ----------------------------------------------------------------------
        # Test 1: Create Fiscal Year
        # ----------------------------------------------------------------------
        t2026_in = TahunAnggaranCreate(
            tahun=2026,
            status="active",
            tanggal_mulai=date(2026, 1, 1),
            tanggal_selesai=date(2026, 12, 31),
            deskripsi="Tahun Anggaran 2026 Aktif",
        )
        t2026 = await tahun_anggaran.create_tahun(session, obj_in=t2026_in, current_user_id=verifier.id_pegawai)
        assert t2026.id_tahun_anggaran is not None
        assert t2026.tahun == 2026
        print("[TEST 1 PASSED] Successfully created TahunAnggaran 2026")

        # ----------------------------------------------------------------------
        # Test 2: Reject Duplicate Fiscal Year
        # ----------------------------------------------------------------------
        try:
            await tahun_anggaran.create_tahun(session, obj_in=t2026_in, current_user_id=verifier.id_pegawai)
            assert False, "Should have raised HTTPException for duplicate tahun"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[TEST 2 PASSED] Duplicate fiscal year rejected: {e.detail}")

        # ----------------------------------------------------------------------
        # Test 3: Create Master Akun Anggaran
        # ----------------------------------------------------------------------
        akun_in = AkunAnggaranCreate(
            id_bagian=bagian.id_bagian,
            kode_akun="521219",
            nama_akun="Belanja Barang Non Operasional Lainnya",
            jenis_belanja="Belanja Barang",
            program="Program KPU",
            sub_program="Dukungan Teknis",
            total_pagu=Decimal("50000000.00"),  # legacy baseline
        )
        akun = await akun_anggaran.create_akun(session, obj_in=akun_in)
        assert akun.id_akun_anggaran is not None
        assert akun.kode_akun == "521219"
        print(f"[TEST 3 PASSED] Created AkunAnggaran: {akun.kode_akun} - {akun.nama_akun}")

        # ----------------------------------------------------------------------
        # Test 4: Verify Auto-Created Pagu (Phase 5 Invariant) & Allocate Pagu
        # ----------------------------------------------------------------------
        pagu_auto = await pagu_anggaran.get_by_tahun_akun(session, t2026.id_tahun_anggaran, akun.id_akun_anggaran)
        assert pagu_auto is not None, "Pagu should be auto-created upon active account creation (Phase 5)"
        assert pagu_auto.pagu_awal == Decimal("0.00")
        assert pagu_auto.pagu_aktif == Decimal("0.00")

        # ----------------------------------------------------------------------
        # Test 5: Reject Duplicate Budget for Same Year and Account
        # ----------------------------------------------------------------------
        pagu_dup_in = PaguAnggaranCreate(
            id_tahun_anggaran=t2026.id_tahun_anggaran,
            id_akun_anggaran=akun.id_akun_anggaran,
            pagu_awal=Decimal("100000000.00"),
        )
        try:
            await pagu_anggaran.create_pagu(session, obj_in=pagu_dup_in)
            assert False, "Should have rejected duplicate budget for same year and account"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[TEST 5 PASSED] Duplicate budget allocation rejected: {e.detail}")

        # Set initial allocation 100M for Test 6+
        rev_init = RevisiAnggaranCreate(
            id_pagu=pagu_auto.id_pagu,
            nomor_revisi="INIT-01/2026",
            tanggal_revisi=date(2026, 1, 2),
            pagu_baru=Decimal("100000000.00"),
            alasan_revisi="Penetapan DIPA Awal 2026",
        )
        await revisi_anggaran.create_revisi(session, obj_in=rev_init, id_pegawai=verifier.id_pegawai)
        pagu = await pagu_anggaran.get(session, pagu_auto.id_pagu)
        assert pagu.pagu_aktif == Decimal("100000000.00")
        print(f"[TEST 4 PASSED] PaguAnggaran allocated: id={pagu.id_pagu}, pagu_aktif={pagu.pagu_aktif}")

        # ----------------------------------------------------------------------
        # Test 6 & 7: Atomic Revision and History Preserved
        # ----------------------------------------------------------------------
        rev_in1 = RevisiAnggaranCreate(
            id_pagu=pagu.id_pagu,
            nomor_revisi="REV-01/2026",
            tanggal_revisi=date(2026, 2, 1),
            pagu_baru=Decimal("120000000.00"),
            alasan_revisi="Penambahan volume kegiatan sosialisasi",
        )
        rev1 = await revisi_anggaran.create_revisi(session, obj_in=rev_in1, id_pegawai=verifier.id_pegawai)
        assert rev1.pagu_sebelum == Decimal("100000000.00")
        assert rev1.pagu_sesudah == Decimal("120000000.00")

        # Second revision
        rev_in2 = RevisiAnggaranCreate(
            id_pagu=pagu.id_pagu,
            nomor_revisi="REV-02/2026",
            tanggal_revisi=date(2026, 2, 15),
            pagu_baru=Decimal("150000000.00"),
            alasan_revisi="Penyesuaian pagu revisi kedua",
        )
        rev2 = await revisi_anggaran.create_revisi(session, obj_in=rev_in2, id_pegawai=verifier.id_pegawai)
        assert rev2.pagu_sebelum == Decimal("120000000.00")
        assert rev2.pagu_sesudah == Decimal("150000000.00")

        # Verify pagu_aktif updated
        pagu_refreshed = await pagu_anggaran.get_detail(session, pagu.id_pagu)
        assert pagu_refreshed.pagu_aktif == Decimal("150000000.00")

        # Verify history intact (init + rev1 + rev2 = 3)
        history = await revisi_anggaran.get_history_by_pagu(session, pagu.id_pagu)
        assert len(history) == 3
        print(f"[TEST 6 & 7 PASSED] Revisions created atomically. Active budget is {pagu_refreshed.pagu_aktif}. History count: {len(history)}")

        # ----------------------------------------------------------------------
        # Test 8: Direct Verified Realization (New Workflow)
        # ----------------------------------------------------------------------
        direct_in = RealisasiAnggaranCreateDraft(
            id_pagu=pagu.id_pagu,
            tanggal_transaksi=date(2026, 3, 1),
            nomor_dokumen="BJU/001/III/2026",
            uraian_kegiatan="Belanja Pengadaan Alat Tulis Kantor",
            jumlah_realisasi=Decimal("30000000.00"),
            periode="Maret 2026",
            bukti_file_path="uploads/realisasi/2026/03/bju_001.pdf",
            bukti_file_nama="bju_001.pdf",
            bukti_file_ukuran=204800,
            bukti_file_mime="application/pdf",
        )
        verified_direct = await realisasi_anggaran.create_realisasi_direct(session, obj_in=direct_in, id_pegawai=operator.id_pegawai)
        assert verified_direct.status == "verified"
        assert verified_direct.id_akun_anggaran == akun.id_akun_anggaran
        assert verified_direct.id_verifier is None
        assert verified_direct.verified_at is not None
        print(f"[TEST 8 PASSED] Direct verified transaction created: id={verified_direct.id_realisasi}, status={verified_direct.status}")

        # ----------------------------------------------------------------------
        # Test 9: Verified direct counts toward budget summary
        # ----------------------------------------------------------------------
        summary = await calculate_budget_summary(session, pagu.id_pagu)
        assert summary.total_realisasi_verified == Decimal("30000000.00")
        assert summary.sisa_anggaran == Decimal("120000000.00")
        assert summary.persentase_serapan == 20.0
        print(f"[TEST 9 PASSED] Direct transaction instantly counts toward budget. Remaining: {summary.sisa_anggaran}")

        # ----------------------------------------------------------------------
        # Test 10, 11, 12, 13: Backward Compatibility for Legacy Draft -> Submitted -> Verified
        # ----------------------------------------------------------------------
        legacy_draft = RealisasiAnggaran(
            id_pagu=pagu.id_pagu,
            id_akun_anggaran=akun.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            tanggal_transaksi=date(2026, 3, 2),
            nomor_dokumen="BJU/LEGACY/III/2026",
            uraian_kegiatan="Belanja Legacy Workflow Draft",
            jumlah_realisasi=Decimal("20000000.00"),
            status="draft",
        )
        session.add(legacy_draft)
        await session.commit()
        await session.refresh(legacy_draft)

        # Submitted
        submitted = await realisasi_anggaran.submit_realisasi(session, id_realisasi=legacy_draft.id_realisasi, current_user_id=operator.id_pegawai)
        assert submitted.status == "submitted"
        print(f"[TEST 10 & 11 PASSED] Legacy draft submitted successfully: id={submitted.id_realisasi}, status={submitted.status}")

        # Verify
        verify_in = RealisasiAnggaranVerify(catatan_verifikasi="SPJ dan kuitansi pembayaran telah lengkap dan sah")
        verified = await realisasi_anggaran.verify_realisasi(
            session,
            id_realisasi=submitted.id_realisasi,
            id_verifier=verifier.id_pegawai,
            obj_in=verify_in,
        )
        assert verified.status == "verified"
        assert verified.id_verifier == verifier.id_pegawai
        assert verified.verified_at is not None
        print(f"[TEST 12 PASSED] Legacy transaction verified: id={verified.id_realisasi}, verifier={verified.id_verifier}")

        # Summary updated with 30M + 20M = 50M
        summary_verified = await calculate_budget_summary(session, pagu.id_pagu)
        assert summary_verified.total_realisasi_verified == Decimal("50000000.00")
        assert summary_verified.sisa_anggaran == Decimal("100000000.00")
        print(f"[TEST 13 PASSED] Budget Summary: Verified={summary_verified.total_realisasi_verified}, Sisa={summary_verified.sisa_anggaran}")

        # ----------------------------------------------------------------------
        # Test 14: Reject Transaction Workflow
        # ----------------------------------------------------------------------
        legacy_draft2 = RealisasiAnggaran(
            id_pagu=pagu.id_pagu,
            id_akun_anggaran=akun.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            tanggal_transaksi=date(2026, 3, 3),
            nomor_dokumen="BJU/002/III/2026",
            uraian_kegiatan="Belanja Spanduk Sosialisasi",
            jumlah_realisasi=Decimal("10000000.00"),
            status="draft",
        )
        session.add(legacy_draft2)
        await session.commit()
        await session.refresh(legacy_draft2)

        sub2 = await realisasi_anggaran.submit_realisasi(session, id_realisasi=legacy_draft2.id_realisasi, current_user_id=operator.id_pegawai)
        rej_in = RealisasiAnggaranReject(catatan_verifikasi="Kuitansi tanda tangan belum basah, harap lengkapi")
        rejected = await realisasi_anggaran.reject_realisasi(session, id_realisasi=sub2.id_realisasi, id_verifier=verifier.id_pegawai, obj_in=rej_in)
        assert rejected.status == "rejected"
        assert rejected.verified_at is None
        assert rejected.catatan_verifikasi == "Kuitansi tanda tangan belum basah, harap lengkapi"

        # Rejected does NOT affect budget summary
        summary_after_reject = await calculate_budget_summary(session, pagu.id_pagu)
        assert summary_after_reject.total_realisasi_verified == Decimal("50000000.00")
        assert summary_after_reject.sisa_anggaran == Decimal("100000000.00")
        print(f"[TEST 14 PASSED] Rejected transaction confirmed: status={rejected.status}, budget unaffected")

        # ----------------------------------------------------------------------
        # Test 15: Overbudget Rejection on Direct Creation
        # ----------------------------------------------------------------------
        # Available budget is currently 100M. Attempt to create 110M.
        over_in = RealisasiAnggaranCreateDraft(
            id_pagu=pagu.id_pagu,
            tanggal_transaksi=date(2026, 3, 5),
            nomor_dokumen="BJU/OVER/III/2026",
            uraian_kegiatan="Kegiatan Bernilai Melebihi Sisa",
            jumlah_realisasi=Decimal("110000000.00"),
        )
        try:
            await realisasi_anggaran.create_realisasi_direct(session, obj_in=over_in, id_pegawai=operator.id_pegawai)
            assert False, "Should have rejected overbudget creation"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[TEST 15 PASSED] Overbudget creation rejected: {e.detail}")

        # ----------------------------------------------------------------------
        # Test 16: Invalid State Transitions Rejected
        # ----------------------------------------------------------------------
        try:
            # Cannot re-verify an already verified transaction (only submitted -> verified allowed)
            await realisasi_anggaran.verify_realisasi(session, id_realisasi=verified.id_realisasi, id_verifier=verifier.id_pegawai, obj_in=verify_in)
            assert False, "Should reject verifying an already verified transaction"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[TEST 16 PASSED] Invalid state transition rejected: {e.detail}")

        # ----------------------------------------------------------------------
        # Test 17: Closed Fiscal Year Rejects New Budget Operations
        # ----------------------------------------------------------------------
        t_closed_in = TahunAnggaranCreate(
            tahun=2024,
            status="closed",
            tanggal_mulai=date(2024, 1, 1),
            tanggal_selesai=date(2024, 12, 31),
            deskripsi="Tahun 2024 Closed",
        )
        t_closed = await tahun_anggaran.create_tahun(session, obj_in=t_closed_in, current_user_id=verifier.id_pegawai)
        try:
            pagu_closed_in = PaguAnggaranCreate(
                id_tahun_anggaran=t_closed.id_tahun_anggaran,
                id_akun_anggaran=akun.id_akun_anggaran,
                pagu_awal=Decimal("10000000.00"),
            )
            await pagu_anggaran.create_pagu(session, obj_in=pagu_closed_in)
            assert False, "Should reject creating budget in closed fiscal year"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[TEST 17 PASSED] Closed fiscal year rejected new allocation: {e.detail}")

        # ----------------------------------------------------------------------
        # Test 18: Legacy Realization with id_pagu=NULL is Readable & Isolated
        # ----------------------------------------------------------------------
        legacy_tx = RealisasiAnggaran(
            id_pagu=None,  # Legacy row
            id_akun_anggaran=akun.id_akun_anggaran,
            id_pegawai=None,
            id_verifier=None,
            tanggal_transaksi=date(2023, 5, 10),
            nomor_dokumen="LEGACY/001/2023",
            uraian_kegiatan="Transaksi Belanja Era Lama",
            jumlah_realisasi=Decimal("9999999.00"),
            status="verified",
        )
        session.add(legacy_tx)
        await session.commit()
        await session.refresh(legacy_tx)

        # Ensure legacy transaction is readable
        loaded_legacy = await realisasi_anggaran.get_detail(session, legacy_tx.id_realisasi)
        assert loaded_legacy is not None
        assert loaded_legacy.id_pagu is None
        assert loaded_legacy.jumlah_realisasi == Decimal("9999999.00")

        # Ensure legacy transaction does NOT contaminate 2026 budget summary
        summary_2026 = await calculate_budget_summary(session, pagu.id_pagu)
        assert summary_2026.total_realisasi_verified == Decimal("50000000.00")
        print(f"[TEST 18 PASSED] Legacy transaction with id_pagu=NULL safely readable and completely isolated from 2026 summary")

        # ----------------------------------------------------------------------
        # CLEANUP: Return Database to Baseline
        # ----------------------------------------------------------------------
        await session.delete(legacy_tx)
        await session.delete(legacy_draft2)
        await session.delete(legacy_draft)
        await session.delete(verified_direct)
        for h in history:
            await session.delete(h)
        await session.delete(pagu)
        await session.delete(t_closed)
        await session.delete(t2026)
        await session.delete(akun)
        await session.delete(operator)
        await session.delete(verifier)
        await session.delete(bagian)
        await session.commit()
        print("[CLEANUP] Database successfully restored to pristine baseline (0 test rows left).")

    print("==================================================")
    print("ALL 18 PHASE 2 SERVICE & BUSINESS TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_phase2_service_tests())
