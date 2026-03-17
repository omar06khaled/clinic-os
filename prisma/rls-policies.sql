-- ============================================================================
-- Clinic OS — Row-Level Security Policies
-- Task 6.1: Multi-Doctor Vaults (Three-Role System)
--
-- INSTRUCTIONS:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this entire file and click Run
--   3. Verify in Database → Tables → each table → RLS tab
--
-- IMPORTANT ARCHITECTURE NOTE:
--   This app uses Prisma with a direct PostgreSQL connection (DATABASE_URL /
--   DIRECT_URL) which uses the 'postgres' superuser role and therefore
--   BYPASSES RLS at the database level. The primary data-isolation mechanism
--   is application-level enforcement in each API route (doctor.id scoping).
--
--   These RLS policies protect direct Supabase client queries (e.g. from a
--   compromised browser session or future client-side Supabase calls) and
--   provide defence-in-depth. They use auth.email() which is populated from
--   the user's JWT — this only works for queries made through the Supabase
--   JS client with the anon/authenticated role, NOT through Prisma.
--
-- FOUR-ROLE SYSTEM:
--   owner        — unrestricted access to ALL data across all tables and all doctors
--   doctor       — sees only their own data (scoped by doctorId)
--   admin        — sees all data in their clinic (all doctorIds in same clinicId)
--   receptionist — same clinic-wide scope as admin for clinical tables;
--                  NO access to Expense or AuditorLog
--
-- TABLE COVERAGE (8 tables):
--   Patient          → owner (all), doctor (own), admin (clinic), receptionist (clinic)
--   ChronicCondition → owner (all), doctor (own via patient), admin (clinic), receptionist (clinic)
--   Appointment      → owner (all), doctor (own), admin (clinic), receptionist (clinic)
--   VisitRecord      → owner (all), doctor (own via patient), admin (clinic), receptionist (clinic)
--   Attachment       → owner (all), doctor (own via record→patient), admin (clinic), receptionist (clinic)
--   AuditorLog       → owner (all), doctor (own), admin (clinic), receptionist (NO ACCESS)
--   Expense          → owner (all), admin (clinic), doctor (NO ACCESS), receptionist (NO ACCESS)
--   Lab              → owner (all), doctor (own), admin (clinic), receptionist (clinic)
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- HELPER NOTE:
--   The subquery pattern used throughout:
--
--     (SELECT id FROM "Doctor" WHERE email = auth.email() AND role = 'X' LIMIT 1)
--
--   Returns NULL if the current user does not have role 'X', which causes the
--   USING predicate to evaluate to false — effectively denying access.
--
--   For clinic-wide access (admin/receptionist), we check:
--     "doctorId" IN (
--       SELECT id FROM "Doctor"
--       WHERE "clinicId" = (
--         SELECT "clinicId" FROM "Doctor" WHERE email = auth.email() LIMIT 1
--       )
--     )
--   AND verify the role separately with EXISTS.
-- ────────────────────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────────────────────
-- 1. PATIENT
--    doctor      → own patients (doctorId = their Doctor.id AND role = 'doctor')
--    admin       → all patients in their clinic
--    receptionist → all patients in their clinic
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_doctor_isolation" ON "Patient";
DROP POLICY IF EXISTS "patient_access" ON "Patient";

CREATE POLICY "patient_access" ON "Patient"
FOR ALL
USING (
  -- Owner: unrestricted access to all patients
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Doctor: own patients only
  "doctorId" = (
    SELECT id FROM "Doctor"
    WHERE email = auth.email() AND role = 'doctor'
    LIMIT 1
  )
  OR
  -- Admin or Receptionist: all patients in their clinic
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "doctorId" IN (
      SELECT id FROM "Doctor"
      WHERE "clinicId" = (
        SELECT "clinicId" FROM "Doctor"
        WHERE email = auth.email()
        LIMIT 1
      )
    )
  )
)
WITH CHECK (
  -- Owner: can write any patient
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Doctor: can only write their own patients
  "doctorId" = (
    SELECT id FROM "Doctor"
    WHERE email = auth.email() AND role = 'doctor'
    LIMIT 1
  )
  OR
  -- Admin or Receptionist: can write any patient in their clinic
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "doctorId" IN (
      SELECT id FROM "Doctor"
      WHERE "clinicId" = (
        SELECT "clinicId" FROM "Doctor"
        WHERE email = auth.email()
        LIMIT 1
      )
    )
  )
);


-- ────────────────────────────────────────────────────────────────────────────
-- 2. CHRONIC CONDITION
--    Follows Patient — scoped through patientId → Patient.doctorId
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE "ChronicCondition" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chroniccondition_doctor_only" ON "ChronicCondition";
DROP POLICY IF EXISTS "chroniccondition_access" ON "ChronicCondition";

CREATE POLICY "chroniccondition_access" ON "ChronicCondition"
FOR ALL
USING (
  -- Owner: unrestricted access to all conditions
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Doctor: conditions for their own patients
  "patientId" IN (
    SELECT id FROM "Patient"
    WHERE "doctorId" = (
      SELECT id FROM "Doctor"
      WHERE email = auth.email() AND role = 'doctor'
      LIMIT 1
    )
  )
  OR
  -- Admin or Receptionist: conditions for all clinic patients
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "patientId" IN (
      SELECT id FROM "Patient"
      WHERE "doctorId" IN (
        SELECT id FROM "Doctor"
        WHERE "clinicId" = (
          SELECT "clinicId" FROM "Doctor"
          WHERE email = auth.email()
          LIMIT 1
        )
      )
    )
  )
)
WITH CHECK (
  -- Owner: can write any condition
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  "patientId" IN (
    SELECT id FROM "Patient"
    WHERE "doctorId" = (
      SELECT id FROM "Doctor"
      WHERE email = auth.email() AND role = 'doctor'
      LIMIT 1
    )
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "patientId" IN (
      SELECT id FROM "Patient"
      WHERE "doctorId" IN (
        SELECT id FROM "Doctor"
        WHERE "clinicId" = (
          SELECT "clinicId" FROM "Doctor"
          WHERE email = auth.email()
          LIMIT 1
        )
      )
    )
  )
);


-- ────────────────────────────────────────────────────────────────────────────
-- 3. APPOINTMENT
--    doctor      → own appointments (doctorId = their id)
--    admin       → all appointments in their clinic
--    receptionist → all appointments in their clinic (can mark arrived/noshow)
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointment_access" ON "Appointment";

CREATE POLICY "appointment_access" ON "Appointment"
FOR ALL
USING (
  -- Owner: unrestricted access to all appointments
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Doctor: own appointments only
  "doctorId" = (
    SELECT id FROM "Doctor"
    WHERE email = auth.email() AND role = 'doctor'
    LIMIT 1
  )
  OR
  -- Admin or Receptionist: all appointments in their clinic
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "doctorId" IN (
      SELECT id FROM "Doctor"
      WHERE "clinicId" = (
        SELECT "clinicId" FROM "Doctor"
        WHERE email = auth.email()
        LIMIT 1
      )
    )
  )
)
WITH CHECK (
  -- Owner: can write any appointment
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Doctor: can only write their own appointments
  "doctorId" = (
    SELECT id FROM "Doctor"
    WHERE email = auth.email() AND role = 'doctor'
    LIMIT 1
  )
  OR
  -- Admin or Receptionist: can write any clinic appointment
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "doctorId" IN (
      SELECT id FROM "Doctor"
      WHERE "clinicId" = (
        SELECT "clinicId" FROM "Doctor"
        WHERE email = auth.email()
        LIMIT 1
      )
    )
  )
);


-- ────────────────────────────────────────────────────────────────────────────
-- 4. VISIT RECORD
--    doctor      → records for their own patients (via patientId → Patient.doctorId)
--    admin       → all records in their clinic
--    receptionist → all records in their clinic
--
--    NOTE: Application-level code deliberately never queries VisitRecord for
--    admin/receptionist views (clinical privacy by design). RLS here is
--    defence-in-depth for direct Supabase client access only.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE "VisitRecord" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visitrecord_doctor_only" ON "VisitRecord";
DROP POLICY IF EXISTS "visitrecord_access" ON "VisitRecord";

CREATE POLICY "visitrecord_access" ON "VisitRecord"
FOR ALL
USING (
  -- Owner: unrestricted access to all visit records
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Doctor: own patients' records only
  "patientId" IN (
    SELECT id FROM "Patient"
    WHERE "doctorId" = (
      SELECT id FROM "Doctor"
      WHERE email = auth.email() AND role = 'doctor'
      LIMIT 1
    )
  )
  OR
  -- Admin or Receptionist: all clinic patients' records
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "patientId" IN (
      SELECT id FROM "Patient"
      WHERE "doctorId" IN (
        SELECT id FROM "Doctor"
        WHERE "clinicId" = (
          SELECT "clinicId" FROM "Doctor"
          WHERE email = auth.email()
          LIMIT 1
        )
      )
    )
  )
)
WITH CHECK (
  -- Owner: can write any visit record
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  "patientId" IN (
    SELECT id FROM "Patient"
    WHERE "doctorId" = (
      SELECT id FROM "Doctor"
      WHERE email = auth.email() AND role = 'doctor'
      LIMIT 1
    )
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "patientId" IN (
      SELECT id FROM "Patient"
      WHERE "doctorId" IN (
        SELECT id FROM "Doctor"
        WHERE "clinicId" = (
          SELECT "clinicId" FROM "Doctor"
          WHERE email = auth.email()
          LIMIT 1
        )
      )
    )
  )
);


-- ────────────────────────────────────────────────────────────────────────────
-- 5. ATTACHMENT
--    Follows VisitRecord → Patient → Doctor chain
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attachment_doctor_only" ON "Attachment";
DROP POLICY IF EXISTS "attachment_access" ON "Attachment";

CREATE POLICY "attachment_access" ON "Attachment"
FOR ALL
USING (
  -- Owner: unrestricted access to all attachments
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Doctor: attachments on their own patients' records
  "recordId" IN (
    SELECT id FROM "VisitRecord"
    WHERE "patientId" IN (
      SELECT id FROM "Patient"
      WHERE "doctorId" = (
        SELECT id FROM "Doctor"
        WHERE email = auth.email() AND role = 'doctor'
        LIMIT 1
      )
    )
  )
  OR
  -- Admin or Receptionist: all clinic attachments
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "recordId" IN (
      SELECT id FROM "VisitRecord"
      WHERE "patientId" IN (
        SELECT id FROM "Patient"
        WHERE "doctorId" IN (
          SELECT id FROM "Doctor"
          WHERE "clinicId" = (
            SELECT "clinicId" FROM "Doctor"
            WHERE email = auth.email()
            LIMIT 1
          )
        )
      )
    )
  )
)
WITH CHECK (
  -- Owner: can write any attachment
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  "recordId" IN (
    SELECT id FROM "VisitRecord"
    WHERE "patientId" IN (
      SELECT id FROM "Patient"
      WHERE "doctorId" = (
        SELECT id FROM "Doctor"
        WHERE email = auth.email() AND role = 'doctor'
        LIMIT 1
      )
    )
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "recordId" IN (
      SELECT id FROM "VisitRecord"
      WHERE "patientId" IN (
        SELECT id FROM "Patient"
        WHERE "doctorId" IN (
          SELECT id FROM "Doctor"
          WHERE "clinicId" = (
            SELECT "clinicId" FROM "Doctor"
            WHERE email = auth.email()
            LIMIT 1
          )
        )
      )
    )
  )
);


-- ────────────────────────────────────────────────────────────────────────────
-- 6. AUDITOR LOG
--    doctor      → their own logs only (doctorId = their id)
--    admin       → all logs in their clinic
--    receptionist → NO ACCESS (financial reconciliation is admin + doctor only)
--
--    WITH CHECK: both doctor and admin can only write logs for their own doctorId.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE "AuditorLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditorlog_access" ON "AuditorLog";

CREATE POLICY "auditorlog_access" ON "AuditorLog"
FOR ALL
USING (
  -- Owner: unrestricted access to all auditor logs
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Doctor: own logs only
  "doctorId" = (
    SELECT id FROM "Doctor"
    WHERE email = auth.email() AND role = 'doctor'
    LIMIT 1
  )
  OR
  -- Admin: all logs in their clinic
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email() AND role = 'admin'
      LIMIT 1
    )
    AND "doctorId" IN (
      SELECT id FROM "Doctor"
      WHERE "clinicId" = (
        SELECT "clinicId" FROM "Doctor"
        WHERE email = auth.email()
        LIMIT 1
      )
    )
  )
  -- Receptionist: NO ACCESS — no clause added here
)
WITH CHECK (
  -- Owner: can write any auditor log
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Only the owning doctor or admin writing their own log
  "doctorId" = (
    SELECT id FROM "Doctor"
    WHERE email = auth.email()
      AND role IN ('doctor', 'admin')
    LIMIT 1
  )
);


-- ────────────────────────────────────────────────────────────────────────────
-- 7. EXPENSE
--    admin       → all expenses in their clinic (full read/write)
--    doctor      → NO ACCESS via Supabase client (Prisma bypasses RLS and
--                  still allows the doctor dashboard expense aggregate)
--    receptionist → NO ACCESS
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expense_clinic_access" ON "Expense";
DROP POLICY IF EXISTS "expense_admin_only" ON "Expense";

CREATE POLICY "expense_admin_only" ON "Expense"
FOR ALL
USING (
  -- Owner: unrestricted access to all expenses
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Admin only: all expenses in their clinic
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email() AND role = 'admin'
      LIMIT 1
    )
    AND "clinicId" = (
      SELECT "clinicId" FROM "Doctor"
      WHERE email = auth.email()
      LIMIT 1
    )
  )
)
WITH CHECK (
  -- Owner: can write any expense
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email() AND role = 'admin'
      LIMIT 1
    )
    AND "clinicId" = (
      SELECT "clinicId" FROM "Doctor"
      WHERE email = auth.email()
      LIMIT 1
    )
  )
);


-- ────────────────────────────────────────────────────────────────────────────
-- 8. LAB
--    doctor      → their own labs (doctorId = their id)
--    admin       → all labs in their clinic
--    receptionist → all labs in their clinic (needs lab list for referrals)
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Lab" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_doctor_isolation" ON "Lab";
DROP POLICY IF EXISTS "lab_access" ON "Lab";

CREATE POLICY "lab_access" ON "Lab"
FOR ALL
USING (
  -- Owner: unrestricted access to all labs
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Doctor: own labs only
  "doctorId" = (
    SELECT id FROM "Doctor"
    WHERE email = auth.email() AND role = 'doctor'
    LIMIT 1
  )
  OR
  -- Admin or Receptionist: all labs in their clinic
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "doctorId" IN (
      SELECT id FROM "Doctor"
      WHERE "clinicId" = (
        SELECT "clinicId" FROM "Doctor"
        WHERE email = auth.email()
        LIMIT 1
      )
    )
  )
)
WITH CHECK (
  -- Owner: can write any lab
  EXISTS (
    SELECT 1 FROM "Doctor"
    WHERE email = auth.email() AND role = 'owner'
    LIMIT 1
  )
  OR
  -- Doctor: can only write their own labs
  "doctorId" = (
    SELECT id FROM "Doctor"
    WHERE email = auth.email() AND role = 'doctor'
    LIMIT 1
  )
  OR
  -- Admin or Receptionist: can write any clinic lab
  (
    EXISTS (
      SELECT 1 FROM "Doctor"
      WHERE email = auth.email()
        AND role IN ('admin', 'receptionist')
      LIMIT 1
    )
    AND "doctorId" IN (
      SELECT id FROM "Doctor"
      WHERE "clinicId" = (
        SELECT "clinicId" FROM "Doctor"
        WHERE email = auth.email()
        LIMIT 1
      )
    )
  )
);


-- ────────────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES
-- Run these after applying the policies to confirm they are enabled.
-- ────────────────────────────────────────────────────────────────────────────

-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'Patient', 'ChronicCondition', 'Appointment',
--     'VisitRecord', 'Attachment', 'AuditorLog', 'Expense', 'Lab'
--   );

-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
