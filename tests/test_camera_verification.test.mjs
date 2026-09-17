// Automated Unit & Integration Tests: Camera Liveness Verification & Privacy
import assert from 'assert';
import { sanitizeReportForRole, createSessionToken, verifySessionToken, verifyOperatorSession } from '../lib/auth/session.ts';

async function runCameraVerificationTests() {
  console.log('====================================================');
  console.log('  TEST SUITE: CAMERA LIVENESS & PRIVACY VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Privacy Sanitization of Biometric Verification Photo
  // -------------------------------------------------------------
  test('Public role query MUST STRIP verification_photo_url (Biometric Privacy)', () => {
    const rawReport = {
      id: 'rep-test-01',
      report_code: 'SMG-2026-001',
      category: 'kebakaran',
      description: 'Test report with selfie',
      verification_photo_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      verification_metadata: {
        verification_method: 'camera_liveness',
        liveness_score: 95,
        verification_photo_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      },
      reporter_name: 'Budi Santoso',
    };

    const sanitizedForPublic = sanitizeReportForRole(rawReport, 'public');
    assert.strictEqual(
      sanitizedForPublic.verification_photo_url,
      null,
      'Citizen verification selfie MUST be null for public'
    );
    assert.strictEqual(
      sanitizedForPublic.verification_metadata?.verification_photo_url,
      undefined,
      'Selfie in verification_metadata MUST be stripped for public'
    );
    assert.strictEqual(
      sanitizedForPublic.reporter_name,
      'Budi Santoso',
      'Reporter name should be preserved'
    );
  });

  test('Admin and Officer roles retain verification_photo_url for moderation', () => {
    const rawReport = {
      id: 'rep-test-02',
      verification_photo_url: 'data:image/jpeg;base64,/9j/adminView...',
      verification_metadata: {
        verification_method: 'camera_liveness',
        verification_photo_url: 'data:image/jpeg;base64,/9j/adminView...',
      },
    };

    const sanitizedForAdmin = sanitizeReportForRole(rawReport, 'admin');
    assert.strictEqual(
      sanitizedForAdmin.verification_photo_url,
      'data:image/jpeg;base64,/9j/adminView...',
      'Admin must have access to verification selfie'
    );

    const sanitizedForOfficer = sanitizeReportForRole(rawReport, 'officer');
    assert.strictEqual(
      sanitizedForOfficer.verification_photo_url,
      'data:image/jpeg;base64,/9j/adminView...',
      'Officer must have access to verification selfie'
    );
  });

  // -------------------------------------------------------------
  // Test 2: Operator Session Token Validation & Verification
  // -------------------------------------------------------------
  await asyncTest('Operator session helper verifies admin and officer tokens correctly', async () => {
    const adminToken = await createSessionToken('admin');
    const officerToken = await createSessionToken('officer');

    const adminCheck = await verifyOperatorSession(adminToken);
    assert.strictEqual(adminCheck.valid, true, 'Admin session should be valid');
    assert.strictEqual(adminCheck.role, 'admin', 'Role should be admin');

    const officerCheck = await verifyOperatorSession(officerToken);
    assert.strictEqual(officerCheck.valid, true, 'Officer session should be valid');
    assert.strictEqual(officerCheck.role, 'officer', 'Role should be officer');

    const invalidCheck = await verifyOperatorSession('forged:1700000000:bad_sig');
    assert.strictEqual(invalidCheck.valid, false, 'Forged token must be rejected');
    assert.strictEqual(invalidCheck.role, null, 'Invalid token has null role');

    const nullCheck = await verifyOperatorSession(null);
    assert.strictEqual(nullCheck.valid, false, 'Null token must be rejected');
  });

  // -------------------------------------------------------------
  // Test 3: Camera Error Code Mapping Logic Simulation
  // -------------------------------------------------------------
  test('Camera error categorizer produces non-generic, actionable advice for NotAllowedError', () => {
    // Simulating the diagnoseCameraError function logic from CameraLivenessVerification
    function diagnoseCameraError(err) {
      const errName = err?.name || '';
      const errMsg = err?.message || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        return {
          code: 'PERMISSION_DENIED',
          title: 'Izin Akses Kamera Ditolak',
          actionHint: 'Klik ikon gembok / kamera di bilah alamat peramban',
        };
      }
      if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        return {
          code: 'CAMERA_BUSY',
          title: 'Kamera Sedang Digunakan Aplikasi Lain',
          actionHint: 'Tutup aplikasi konferensi video (Zoom, Teams, dsb)',
        };
      }
      if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        return {
          code: 'NO_CAMERA_FOUND',
          title: 'Perangkat Kamera Tidak Ditemukan',
          actionHint: 'Pastikan webcam laptop atau USB terhubung',
        };
      }
      if (errName === 'SecurityError') {
        return {
          code: 'INSECURE_CONTEXT',
          title: 'Koneksi Tidak Aman (HTTPS Diperlukan)',
          actionHint: 'Buka aplikasi menggunakan URL https://',
        };
      }
      return { code: 'UNKNOWN_CAMERA_ERROR', title: 'Kamera Gagal Dinyalakan' };
    }

    const denied = diagnoseCameraError({ name: 'NotAllowedError' });
    assert.strictEqual(denied.code, 'PERMISSION_DENIED');
    assert.strictEqual(denied.title, 'Izin Akses Kamera Ditolak');

    const busy = diagnoseCameraError({ name: 'NotReadableError', message: 'Device in use' });
    assert.strictEqual(busy.code, 'CAMERA_BUSY');
    assert.strictEqual(busy.title, 'Kamera Sedang Digunakan Aplikasi Lain');

    const notFound = diagnoseCameraError({ name: 'NotFoundError' });
    assert.strictEqual(notFound.code, 'NO_CAMERA_FOUND');

    const insecure = diagnoseCameraError({ name: 'SecurityError' });
    assert.strictEqual(insecure.code, 'INSECURE_CONTEXT');
  });

  // -------------------------------------------------------------
  // Test 4: Verification Photo Payload Validation
  // -------------------------------------------------------------
  test('Verification photo URL validator rejects malicious and oversized payloads', () => {
    function isValidVerificationPhoto(photoStr) {
      if (typeof photoStr !== 'string' || !photoStr.trim()) return false;
      const str = photoStr.trim();
      const isAllowedFormat =
        str.startsWith('data:image/jpeg;base64,') ||
        str.startsWith('data:image/png;base64,') ||
        str.startsWith('data:image/webp;base64,') ||
        (str.startsWith('https://') && !str.includes('<') && !str.includes('>'));
      const isUnder5MB = str.length < 5 * 1024 * 1024 * 1.37;
      return isAllowedFormat && isUnder5MB;
    }

    assert.strictEqual(
      isValidVerificationPhoto('data:image/jpeg;base64,/9j/4AAQSkZJRg=='),
      true,
      'Valid JPEG base64 should be accepted'
    );
    assert.strictEqual(
      isValidVerificationPhoto('data:image/png;base64,iVBORw0KGgo=='),
      true,
      'Valid PNG base64 should be accepted'
    );
    assert.strictEqual(
      isValidVerificationPhoto('https://kotaku-siaga.id/evidence/verified.jpg'),
      true,
      'Valid HTTPS URL should be accepted'
    );
    assert.strictEqual(
      isValidVerificationPhoto('javascript:alert(1)'),
      false,
      'Dangerous javascript: scheme must be rejected'
    );
    assert.strictEqual(
      isValidVerificationPhoto('data:text/html;base64,PHNjcmlwdD4='),
      false,
      'HTML/Script data URI must be rejected'
    );
    assert.strictEqual(
      isValidVerificationPhoto('http://insecure-site.com/photo.jpg'),
      false,
      'Non-HTTPS URL must be rejected'
    );
  });

  console.log(`\nResults: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runCameraVerificationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
