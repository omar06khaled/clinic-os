import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // ── 1. Clinic ────────────────────────────────────────────────
  const clinic = await prisma.clinic.upsert({
    where: { id: "clinic-001" },
    update: {
      name:             "عيادة الأمل",
      address:          "شارع التحرير، المعادي، القاهرة",
      phone:            "+201001234567",
      whatsappNumber:   "+201001234567",
      defaultFee:       300,
      isMultiDoctor:    true,
      subscriptionTier: "professional",
    },
    create: {
      id:               "clinic-001",
      name:             "عيادة الأمل",
      address:          "شارع التحرير، المعادي، القاهرة",
      phone:            "+201001234567",
      whatsappNumber:   "+201001234567",
      defaultFee:       300,
      isMultiDoctor:    true,
      subscriptionTier: "professional",
    },
  })

  // ── 2. Doctors ───────────────────────────────────────────────
 const doctorAhmed = await prisma.doctor.upsert({
  where: { email: "omarkhalednassar@gmail.com" },
  update: {},
  create: {
    id:        "doctor-ahmed",
    clinicId:  clinic.id,
    name:      "Dr. Ahmed Mahmoud",
    specialty: "General Practice",
    email:     "omarkhalednassar@gmail.com",  // ← fix this
    role:      "admin",
    isActive:  true,
  },
})

  const doctorSara = await prisma.doctor.upsert({
    where: { email: "sara.hassan@amalelklinik.com" },
    update: {},
    create: {
      id:        "doctor-sara",
      clinicId:  clinic.id,
      name:      "Dr. Sara Hassan",
      specialty: "Gynecology",
      email:     "sara.hassan@amalelklinik.com",
      role:      "doctor",
      isActive:  true,
    },
  })


  // ── 3. Patients ──────────────────────────────────────────────
  const patientMohamed = await prisma.patient.upsert({
    where: { id: "patient-001" },
    update: { name: "محمد علي" },
    create: {
      id:             "patient-001",
      doctorId:       doctorAhmed.id,
      name:           "محمد علي",
      phone:          "+201112345678",
      age:            52,
      gender:         "male",
      bloodType:      "A+",
      allergies:      "Penicillin",
      permanentNotes: "مريض سكري منذ 10 سنوات، يحتاج متابعة منتظمة",
      isNew:          false,
    },
  })

  const patientFatma = await prisma.patient.upsert({
    where: { id: "patient-002" },
    update: { name: "فاطمة حسن" },
    create: {
      id:             "patient-002",
      doctorId:       doctorAhmed.id,
      name:           "فاطمة حسن",
      phone:          "+201223456789",
      age:            61,
      gender:         "female",
      bloodType:      "B+",
      permanentNotes: "ضغط دم مرتفع، تأخذ علاج منتظم",
      isNew:          false,
    },
  })

  const patientKhaled = await prisma.patient.upsert({
    where: { id: "patient-003" },
    update: { name: "خالد إبراهيم" },
    create: {
      id:             "patient-003",
      doctorId:       doctorAhmed.id,
      name:           "خالد إبراهيم",
      phone:          "+201334567890",
      age:            58,
      gender:         "male",
      bloodType:      "O+",
      allergies:      "Aspirin",
      permanentNotes: "مريض قلب، تدخل جراحي سابق 2020، يحتاج متابعة دقيقة",
      isNew:          false,
    },
  })

  const patientNour = await prisma.patient.upsert({
    where: { id: "patient-004" },
    update: {},
    create: {
      id:        "patient-004",
      doctorId:  doctorSara.id,
      name:      "Nour Ahmed",
      phone:     "+201445678901",
      age:       28,
      gender:    "female",
      bloodType: "AB+",
      isNew:     false,
    },
  })

  const patientHana = await prisma.patient.upsert({
    where: { id: "patient-005" },
    update: {},
    create: {
      id:        "patient-005",
      doctorId:  doctorSara.id,
      name:      "Hana Mohamed",
      phone:     "+201556789012",
      age:       33,
      gender:    "female",
      bloodType: "A-",
      isNew:     false,
    },
  })

  const patientYoussef = await prisma.patient.upsert({
    where: { id: "patient-006" },
    update: {},
    create: {
      id:        "patient-006",
      doctorId:  doctorAhmed.id,
      name:      "Youssef Kamal",
      phone:     "+201667890123",
      age:       40,
      gender:    "male",
      bloodType: "B-",
      isNew:     false,
    },
  })

  const patientAmira = await prisma.patient.upsert({
    where: { id: "patient-007" },
    update: {},
    create: {
      id:        "patient-007",
      doctorId:  doctorSara.id,
      name:      "Amira Saad",
      phone:     "+201778901234",
      age:       25,
      gender:    "female",
      bloodType: "O-",
      isNew:     true,
    },
  })

  const patientHassan = await prisma.patient.upsert({
    where: { id: "patient-008" },
    update: { name: "حسن علي" },
    create: {
      id:        "patient-008",
      doctorId:  doctorAhmed.id,
      name:      "حسن علي",
      phone:     "+201889012345",
      age:       45,
      gender:    "male",
      bloodType: "A+",
      isNew:     false,
    },
  })

  const patientLayla = await prisma.patient.upsert({
    where: { id: "patient-009" },
    update: {},
    create: {
      id:        "patient-009",
      doctorId:  doctorSara.id,
      name:      "Layla Ibrahim",
      phone:     "+201990123456",
      age:       30,
      gender:    "female",
      bloodType: "B+",
      isNew:     true,
    },
  })

  await prisma.patient.upsert({
    where: { id: "patient-010" },
    update: { name: "عمر مصطفى" },
    create: {
      id:        "patient-010",
      doctorId:  doctorAhmed.id,
      name:      "عمر مصطفى",
      phone:     "+201011234567",
      age:       35,
      gender:    "male",
      bloodType: "O+",
      isNew:     false,
    },
  })

  // ── 4. Chronic Conditions ────────────────────────────────────
  await prisma.chronicCondition.upsert({
    where: { id: "cond-001" },
    update: {},
    create: {
      id:        "cond-001",
      patientId: patientMohamed.id,
      type:      "diabetes",
      notes:     "Type 2 diabetes since 2014, on Metformin",
    },
  })

  await prisma.chronicCondition.upsert({
    where: { id: "cond-002" },
    update: {},
    create: {
      id:        "cond-002",
      patientId: patientFatma.id,
      type:      "hypertension",
      notes:     "Essential hypertension, on Amlodipine 5mg daily",
    },
  })

  await prisma.chronicCondition.upsert({
    where: { id: "cond-003" },
    update: {},
    create: {
      id:        "cond-003",
      patientId: patientKhaled.id,
      type:      "cardiac",
      notes:     "Ischemic heart disease, previous CABG 2020, on Clopidogrel + Atorvastatin",
    },
  })

  // ── 5. Appointments (20 total) ───────────────────────────────

  // Mohamed Ali — 6 appointments (5 arrived + 1 scheduled)
  const apptMA1 = await prisma.appointment.upsert({
    where: { id: "appt-001" },
    update: {},
    create: {
      id:            "appt-001",
      doctorId:      doctorAhmed.id,
      patientId:     patientMohamed.id,
      scheduledAt:   new Date("2026-01-15T10:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة السكري",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    300,
      convenienceFee: 0,
    },
  })

  const apptMA2 = await prisma.appointment.upsert({
    where: { id: "appt-002" },
    update: {},
    create: {
      id:            "appt-002",
      doctorId:      doctorAhmed.id,
      patientId:     patientMohamed.id,
      scheduledAt:   new Date("2026-01-29T10:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة السكري",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    300,
      convenienceFee: 0,
    },
  })

  const apptMA3 = await prisma.appointment.upsert({
    where: { id: "appt-003" },
    update: {},
    create: {
      id:            "appt-003",
      doctorId:      doctorAhmed.id,
      patientId:     patientMohamed.id,
      scheduledAt:   new Date("2026-02-12T10:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة السكري وتحاليل",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "instapay",
      amountPaid:    305,
      convenienceFee: 5,
    },
  })

  const apptMA4 = await prisma.appointment.upsert({
    where: { id: "appt-004" },
    update: {},
    create: {
      id:            "appt-004",
      doctorId:      doctorAhmed.id,
      patientId:     patientMohamed.id,
      scheduledAt:   new Date("2026-02-26T10:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة السكري",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    300,
      convenienceFee: 0,
    },
  })

  const apptMA5 = await prisma.appointment.upsert({
    where: { id: "appt-005" },
    update: {},
    create: {
      id:            "appt-005",
      doctorId:      doctorAhmed.id,
      patientId:     patientMohamed.id,
      scheduledAt:   new Date("2026-03-11T10:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة السكري",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    300,
      convenienceFee: 0,
    },
  })

  await prisma.appointment.upsert({
    where: { id: "appt-006" },
    update: {},
    create: {
      id:            "appt-006",
      doctorId:      doctorAhmed.id,
      patientId:     patientMohamed.id,
      scheduledAt:   new Date("2026-03-25T10:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة السكري",
      confirmStatus: "unconfirmed",
      status:        "scheduled",
      paymentStatus: "pending",
      convenienceFee: 5,
    },
  })

  // Fatma Hassan — 5 appointments (3 arrived + 1 noshow + 1 scheduled)
  const apptFH1 = await prisma.appointment.upsert({
    where: { id: "appt-007" },
    update: {},
    create: {
      id:            "appt-007",
      doctorId:      doctorAhmed.id,
      patientId:     patientFatma.id,
      scheduledAt:   new Date("2026-01-20T11:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة ضغط الدم",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    300,
      convenienceFee: 0,
    },
  })

  const apptFH2 = await prisma.appointment.upsert({
    where: { id: "appt-008" },
    update: {},
    create: {
      id:            "appt-008",
      doctorId:      doctorAhmed.id,
      patientId:     patientFatma.id,
      scheduledAt:   new Date("2026-02-03T11:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة ضغط الدم ودوار",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "fawry",
      amountPaid:    300,
      convenienceFee: 0,
    },
  })

  await prisma.appointment.upsert({
    where: { id: "appt-009" },
    update: {},
    create: {
      id:            "appt-009",
      doctorId:      doctorAhmed.id,
      patientId:     patientFatma.id,
      scheduledAt:   new Date("2026-02-17T11:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة ضغط الدم",
      confirmStatus: "confirmed",
      status:        "noshow",
      paymentStatus: "pending",
      convenienceFee: 0,
    },
  })

  const apptFH3 = await prisma.appointment.upsert({
    where: { id: "appt-010" },
    update: {},
    create: {
      id:            "appt-010",
      doctorId:      doctorAhmed.id,
      patientId:     patientFatma.id,
      scheduledAt:   new Date("2026-03-03T11:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة ضغط الدم",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    300,
      convenienceFee: 0,
    },
  })

  await prisma.appointment.upsert({
    where: { id: "appt-011" },
    update: {},
    create: {
      id:            "appt-011",
      doctorId:      doctorAhmed.id,
      patientId:     patientFatma.id,
      scheduledAt:   new Date("2026-03-17T11:00:00"),
      visitType:     "followup",
      complaint:     "متابعة",
      confirmStatus: "unconfirmed",
      status:        "scheduled",
      paymentStatus: "pending",
      convenienceFee: 5,
    },
  })

  // Khaled Ibrahim — 4 appointments (3 arrived + 1 scheduled)
  const apptKI1 = await prisma.appointment.upsert({
    where: { id: "appt-012" },
    update: {},
    create: {
      id:            "appt-012",
      doctorId:      doctorAhmed.id,
      patientId:     patientKhaled.id,
      scheduledAt:   new Date("2026-01-22T12:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة القلب",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    400,
      convenienceFee: 0,
    },
  })

  const apptKI2 = await prisma.appointment.upsert({
    where: { id: "appt-013" },
    update: {},
    create: {
      id:            "appt-013",
      doctorId:      doctorAhmed.id,
      patientId:     patientKhaled.id,
      scheduledAt:   new Date("2026-02-05T12:00:00"),
      visitType:     "chronic",
      complaint:     "ألم في الصدر خفيف",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "instapay",
      amountPaid:    405,
      convenienceFee: 5,
    },
  })

  const apptKI3 = await prisma.appointment.upsert({
    where: { id: "appt-014" },
    update: {},
    create: {
      id:            "appt-014",
      doctorId:      doctorAhmed.id,
      patientId:     patientKhaled.id,
      scheduledAt:   new Date("2026-02-19T12:00:00"),
      visitType:     "chronic",
      complaint:     "متابعة القلب",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    400,
      convenienceFee: 0,
    },
  })

  await prisma.appointment.upsert({
    where: { id: "appt-015" },
    update: {},
    create: {
      id:            "appt-015",
      doctorId:      doctorAhmed.id,
      patientId:     patientKhaled.id,
      scheduledAt:   new Date("2026-03-05T12:00:00"),
      visitType:     "followup",
      complaint:     "متابعة القلب",
      confirmStatus: "confirmed",
      status:        "scheduled",
      paymentStatus: "pending",
      convenienceFee: 0,
    },
  })

  // Other patients — 5 appointments
  const apptNour = await prisma.appointment.upsert({
    where: { id: "appt-016" },
    update: {},
    create: {
      id:            "appt-016",
      doctorId:      doctorSara.id,
      patientId:     patientNour.id,
      scheduledAt:   new Date("2026-02-10T09:00:00"),
      visitType:     "followup",
      complaint:     "متابعة دورية",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    350,
      convenienceFee: 0,
    },
  })

  await prisma.appointment.upsert({
    where: { id: "appt-017" },
    update: {},
    create: {
      id:            "appt-017",
      doctorId:      doctorSara.id,
      patientId:     patientHana.id,
      scheduledAt:   new Date("2026-02-15T09:30:00"),
      visitType:     "new",
      complaint:     "كشف أول",
      confirmStatus: "confirmed",
      status:        "cancelled",
      paymentStatus: "pending",
      convenienceFee: 0,
      notes:         "تم الإلغاء من قبل المريضة",
    },
  })

  const apptYoussef = await prisma.appointment.upsert({
    where: { id: "appt-018" },
    update: {},
    create: {
      id:            "appt-018",
      doctorId:      doctorAhmed.id,
      patientId:     patientYoussef.id,
      scheduledAt:   new Date("2026-02-20T14:00:00"),
      visitType:     "new",
      complaint:     "برد وسعال",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    300,
      convenienceFee: 0,
    },
  })

  const apptAmira = await prisma.appointment.upsert({
    where: { id: "appt-019" },
    update: {},
    create: {
      id:            "appt-019",
      doctorId:      doctorSara.id,
      patientId:     patientAmira.id,
      scheduledAt:   new Date("2026-03-01T10:00:00"),
      visitType:     "walkin",
      complaint:     "آلام أسفل البطن",
      confirmStatus: "walkin",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    350,
      convenienceFee: 0,
    },
  })

  const apptHassan = await prisma.appointment.upsert({
    where: { id: "appt-020" },
    update: {},
    create: {
      id:            "appt-020",
      doctorId:      doctorAhmed.id,
      patientId:     patientHassan.id,
      scheduledAt:   new Date("2026-03-02T15:00:00"),
      visitType:     "followup",
      complaint:     "آلام في الظهر",
      confirmStatus: "confirmed",
      status:        "arrived",
      paymentStatus: "paid",
      paymentMethod: "cash",
      amountPaid:    300,
      convenienceFee: 0,
    },
  })

  // Extra scheduled appointment for Layla (no visit record needed)
  await prisma.appointment.upsert({
    where: { id: "appt-021" },
    update: {},
    create: {
      id:            "appt-021",
      doctorId:      doctorSara.id,
      patientId:     patientLayla.id,
      scheduledAt:   new Date("2026-03-20T09:00:00"),
      visitType:     "new",
      complaint:     "كشف أول",
      confirmStatus: "unconfirmed",
      status:        "scheduled",
      paymentStatus: "pending",
      convenienceFee: 5,
    },
  })

  // ── 6. Visit Records (15 total) ──────────────────────────────

  // Mohamed Ali — 5 visit records
  await prisma.visitRecord.upsert({
    where: { id: "vr-001" },
    update: {},
    create: {
      id:            "vr-001",
      appointmentId: apptMA1.id,
      patientId:     patientMohamed.id,
      complaint:     "متابعة السكري",
      vitalsBP:      "130/85",
      vitalsPulse:   78,
      vitalsTemp:    36.8,
      vitalsWeight:  88.0,
      vitalsO2:      98,
      symptoms:      JSON.stringify(["إرهاق خفيف", "عطش"]),
      diagnosis:     "Type 2 Diabetes - controlled",
      prescription:  JSON.stringify([
        { drug: "Metformin",     dose: "500mg",  frequency: "مرتين يومياً", duration: "شهر" },
        { drug: "Glucophage XR", dose: "1000mg", frequency: "مرة مساءً",   duration: "شهر" },
      ]),
      followUpDays:   14,
      followUpReason: "متابعة مستوى السكر",
      doctorNotes:    "السكر تحت السيطرة، يحتاج تحليل HbA1c بعد شهر",
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: "vr-002" },
    update: {},
    create: {
      id:            "vr-002",
      appointmentId: apptMA2.id,
      patientId:     patientMohamed.id,
      complaint:     "متابعة السكري",
      vitalsBP:      "128/82",
      vitalsPulse:   76,
      vitalsTemp:    36.6,
      vitalsWeight:  87.5,
      vitalsO2:      98,
      symptoms:      JSON.stringify(["خدر في القدمين"]),
      diagnosis:     "Type 2 Diabetes - peripheral neuropathy signs",
      prescription:  JSON.stringify([
        { drug: "Metformin",    dose: "500mg",   frequency: "مرتين يومياً", duration: "شهر"    },
        { drug: "Vitamin B12",  dose: "1000mcg", frequency: "مرة يومياً",   duration: "شهرين"  },
      ]),
      labReferrals:   JSON.stringify([
        { test: "HbA1c",        lab: "مختبر النيل", notes: "صيام 8 ساعات",  received: false },
        { test: "Lipid Profile", lab: "مختبر النيل", notes: "صيام 12 ساعة", received: false },
      ]),
      followUpDays:   14,
      followUpReason: "متابعة نتائج التحاليل",
      doctorNotes:    "علامات اعتلال الأعصاب الطرفية، تم إضافة B12",
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: "vr-003" },
    update: {},
    create: {
      id:            "vr-003",
      appointmentId: apptMA3.id,
      patientId:     patientMohamed.id,
      complaint:     "متابعة السكري وتحاليل",
      vitalsBP:      "132/86",
      vitalsPulse:   80,
      vitalsTemp:    36.7,
      vitalsWeight:  88.2,
      vitalsO2:      97,
      symptoms:      JSON.stringify(["إرهاق"]),
      diagnosis:     "Type 2 Diabetes - HbA1c 8.2% - needs adjustment",
      prescription:  JSON.stringify([
        { drug: "Metformin", dose: "1000mg", frequency: "مرتين يومياً", duration: "شهر" },
        { drug: "Januvia",   dose: "100mg",  frequency: "مرة يومياً",   duration: "شهر" },
      ]),
      followUpDays: 14,
      doctorNotes:  "HbA1c 8.2% - تعديل الجرعة ضروري، تم إضافة Sitagliptin",
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: "vr-004" },
    update: {},
    create: {
      id:            "vr-004",
      appointmentId: apptMA4.id,
      patientId:     patientMohamed.id,
      complaint:     "متابعة السكري",
      vitalsBP:      "126/80",
      vitalsPulse:   74,
      vitalsTemp:    36.5,
      vitalsWeight:  87.0,
      vitalsO2:      98,
      symptoms:      JSON.stringify([]),
      diagnosis:     "Type 2 Diabetes - improving",
      prescription:  JSON.stringify([
        { drug: "Metformin", dose: "1000mg", frequency: "مرتين يومياً", duration: "شهر" },
        { drug: "Januvia",   dose: "100mg",  frequency: "مرة يومياً",   duration: "شهر" },
      ]),
      followUpDays: 14,
      doctorNotes:  "تحسن ملحوظ في مستوى السكر",
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: "vr-005" },
    update: {},
    create: {
      id:            "vr-005",
      appointmentId: apptMA5.id,
      patientId:     patientMohamed.id,
      complaint:     "متابعة السكري",
      vitalsBP:      "124/78",
      vitalsPulse:   72,
      vitalsTemp:    36.6,
      vitalsWeight:  86.5,
      vitalsO2:      99,
      symptoms:      JSON.stringify([]),
      diagnosis:     "Type 2 Diabetes - well controlled",
      prescription:  JSON.stringify([
        { drug: "Metformin", dose: "1000mg", frequency: "مرتين يومياً", duration: "شهر" },
        { drug: "Januvia",   dose: "100mg",  frequency: "مرة يومياً",   duration: "شهر" },
      ]),
      followUpDays: 14,
      doctorNotes:  "تحكم ممتاز في السكر، استمرار العلاج الحالي",
    },
  })

  // Fatma Hassan — 3 visit records
  await prisma.visitRecord.upsert({
    where: { id: "vr-006" },
    update: {},
    create: {
      id:            "vr-006",
      appointmentId: apptFH1.id,
      patientId:     patientFatma.id,
      complaint:     "متابعة ضغط الدم",
      vitalsBP:      "155/95",
      vitalsPulse:   82,
      vitalsTemp:    36.8,
      vitalsWeight:  75.0,
      vitalsO2:      97,
      symptoms:      JSON.stringify(["صداع", "دوار خفيف"]),
      diagnosis:     "Essential Hypertension - not well controlled",
      prescription:  JSON.stringify([
        { drug: "Amlodipine", dose: "10mg", frequency: "مرة يومياً", duration: "شهر" },
        { drug: "Losartan",   dose: "50mg", frequency: "مرة يومياً", duration: "شهر" },
      ]),
      followUpDays:   14,
      followUpReason: "متابعة استجابة العلاج",
      doctorNotes:    "الضغط غير متحكم فيه، تم رفع جرعة Amlodipine وإضافة Losartan",
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: "vr-007" },
    update: {},
    create: {
      id:            "vr-007",
      appointmentId: apptFH2.id,
      patientId:     patientFatma.id,
      complaint:     "متابعة ضغط الدم ودوار",
      vitalsBP:      "145/90",
      vitalsPulse:   79,
      vitalsTemp:    36.7,
      vitalsWeight:  74.8,
      vitalsO2:      97,
      symptoms:      JSON.stringify(["دوار عند الوقوف"]),
      diagnosis:     "Essential Hypertension - improving",
      prescription:  JSON.stringify([
        { drug: "Amlodipine", dose: "10mg", frequency: "مرة يومياً", duration: "شهر" },
        { drug: "Losartan",   dose: "50mg", frequency: "مرة يومياً", duration: "شهر" },
      ]),
      followUpDays: 14,
      doctorNotes:  "تحسن في الضغط، الدوار أقل",
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: "vr-008" },
    update: {},
    create: {
      id:            "vr-008",
      appointmentId: apptFH3.id,
      patientId:     patientFatma.id,
      complaint:     "متابعة ضغط الدم",
      vitalsBP:      "138/85",
      vitalsPulse:   76,
      vitalsTemp:    36.6,
      vitalsWeight:  74.5,
      vitalsO2:      98,
      symptoms:      JSON.stringify([]),
      diagnosis:     "Essential Hypertension - controlled",
      prescription:  JSON.stringify([
        { drug: "Amlodipine", dose: "10mg", frequency: "مرة يومياً", duration: "شهرين" },
        { drug: "Losartan",   dose: "50mg", frequency: "مرة يومياً", duration: "شهرين" },
      ]),
      followUpDays: 30,
      doctorNotes:  "الضغط تحت السيطرة، تجديد العلاج لشهرين",
    },
  })

  // Khaled Ibrahim — 3 visit records
  await prisma.visitRecord.upsert({
    where: { id: "vr-009" },
    update: {},
    create: {
      id:            "vr-009",
      appointmentId: apptKI1.id,
      patientId:     patientKhaled.id,
      complaint:     "متابعة القلب",
      vitalsBP:      "125/80",
      vitalsPulse:   65,
      vitalsTemp:    36.7,
      vitalsWeight:  82.0,
      vitalsO2:      97,
      symptoms:      JSON.stringify(["إرهاق عند المجهود"]),
      diagnosis:     "Ischemic Heart Disease - stable",
      prescription:  JSON.stringify([
        { drug: "Clopidogrel",   dose: "75mg", frequency: "مرة يومياً",  duration: "شهر" },
        { drug: "Atorvastatin",  dose: "40mg", frequency: "مرة مساءً",   duration: "شهر" },
        { drug: "Bisoprolol",    dose: "5mg",  frequency: "مرة يومياً",  duration: "شهر" },
      ]),
      followUpDays: 14,
      doctorNotes:  "الحالة مستقرة، استمرار العلاج",
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: "vr-010" },
    update: {},
    create: {
      id:            "vr-010",
      appointmentId: apptKI2.id,
      patientId:     patientKhaled.id,
      complaint:     "ألم في الصدر خفيف",
      vitalsBP:      "130/82",
      vitalsPulse:   68,
      vitalsTemp:    36.8,
      vitalsWeight:  81.5,
      vitalsO2:      96,
      symptoms:      JSON.stringify(["ألم صدر خفيف", "ضيق تنفس عند الجهد"]),
      diagnosis:     "Ischemic Heart Disease - angina episode - mild",
      prescription:  JSON.stringify([
        { drug: "Clopidogrel",               dose: "75mg", frequency: "مرة يومياً",    duration: "شهر"     },
        { drug: "Isosorbide Mononitrate",    dose: "20mg", frequency: "مرتين يومياً",  duration: "أسبوعين" },
        { drug: "Atorvastatin",              dose: "40mg", frequency: "مرة مساءً",     duration: "شهر"     },
      ]),
      labReferrals:   JSON.stringify([
        { test: "ECG",             lab: "مختبر الأمل", notes: "عاجل", received: true },
        { test: "Cardiac Enzymes", lab: "مختبر الأمل", notes: "عاجل", received: true },
      ]),
      followUpDays:   7,
      followUpReason: "متابعة عاجلة لألم الصدر",
      doctorNotes:    "ECG طبيعي، Enzymes سلبية، تحسن تدريجي",
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: "vr-011" },
    update: {},
    create: {
      id:            "vr-011",
      appointmentId: apptKI3.id,
      patientId:     patientKhaled.id,
      complaint:     "متابعة القلب",
      vitalsBP:      "122/78",
      vitalsPulse:   64,
      vitalsTemp:    36.6,
      vitalsWeight:  81.0,
      vitalsO2:      98,
      symptoms:      JSON.stringify([]),
      diagnosis:     "Ischemic Heart Disease - stable, no angina",
      prescription:  JSON.stringify([
        { drug: "Clopidogrel",  dose: "75mg", frequency: "مرة يومياً", duration: "شهر" },
        { drug: "Atorvastatin", dose: "40mg", frequency: "مرة مساءً",  duration: "شهر" },
        { drug: "Bisoprolol",   dose: "5mg",  frequency: "مرة يومياً", duration: "شهر" },
      ]),
      followUpDays: 14,
      doctorNotes:  "الحالة مستقرة، توقف ألم الصدر",
    },
  })

  // Remaining patients — 4 visit records
  await prisma.visitRecord.upsert({
    where: { id: "vr-012" },
    update: {},
    create: {
      id:            "vr-012",
      appointmentId: apptNour.id,
      patientId:     patientNour.id,
      complaint:     "متابعة دورية",
      vitalsBP:      "110/70",
      vitalsPulse:   72,
      vitalsTemp:    36.5,
      vitalsWeight:  58.0,
      vitalsO2:      99,
      symptoms:      JSON.stringify([]),
      diagnosis:     "Routine gynecological checkup - normal",
      prescription:  JSON.stringify([
        { drug: "Folic Acid", dose: "400mcg", frequency: "مرة يومياً", duration: "شهر" },
      ]),
      followUpDays: 30,
      doctorNotes:  "كشف دوري طبيعي",
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: "vr-013" },
    update: {},
    create: {
      id:            "vr-013",
      appointmentId: apptYoussef.id,
      patientId:     patientYoussef.id,
      complaint:     "برد وسعال",
      vitalsBP:      "118/76",
      vitalsPulse:   88,
      vitalsTemp:    37.8,
      vitalsWeight:  79.0,
      vitalsO2:      97,
      symptoms:      JSON.stringify(["سعال", "رشح", "حمى خفيفة"]),
      diagnosis:     "Upper Respiratory Tract Infection - viral",
      prescription:  JSON.stringify([
        { drug: "Paracetamol",      dose: "500mg", frequency: "3 مرات يومياً عند الحاجة", duration: "5 أيام" },
        { drug: "Loratadine",       dose: "10mg",  frequency: "مرة يومياً",               duration: "5 أيام" },
        { drug: "Dextromethorphan", dose: "15mg",  frequency: "3 مرات يومياً",            duration: "5 أيام" },
      ]),
      followUpDays:   7,
      followUpReason: "متابعة إذا لم تتحسن الحالة",
      doctorNotes:    "عدوى فيروسية، راحة وسوائل كافية",
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: "vr-014" },
    update: {},
    create: {
      id:            "vr-014",
      appointmentId: apptAmira.id,
      patientId:     patientAmira.id,
      complaint:     "آلام أسفل البطن",
      vitalsBP:      "112/72",
      vitalsPulse:   76,
      vitalsTemp:    36.9,
      vitalsWeight:  55.0,
      vitalsO2:      99,
      symptoms:      JSON.stringify(["ألم أسفل البطن", "غثيان"]),
      diagnosis:     "Dysmenorrhea - primary",
      prescription:  JSON.stringify([
        { drug: "Ibuprofen", dose: "400mg", frequency: "3 مرات يومياً بعد الأكل", duration: "5 أيام" },
        { drug: "Hyoscine",  dose: "10mg",  frequency: "عند الحاجة",              duration: "3 أيام" },
      ]),
      doctorNotes: "آلام الدورة الشهرية - علاج تحفظي",
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: "vr-015" },
    update: {},
    create: {
      id:            "vr-015",
      appointmentId: apptHassan.id,
      patientId:     patientHassan.id,
      complaint:     "آلام في الظهر",
      vitalsBP:      "120/78",
      vitalsPulse:   74,
      vitalsTemp:    36.7,
      vitalsWeight:  83.0,
      vitalsO2:      98,
      symptoms:      JSON.stringify(["آلام في أسفل الظهر", "صعوبة الانحناء"]),
      diagnosis:     "Lumbar Strain - muscular",
      prescription:  JSON.stringify([
        { drug: "Diclofenac Sodium", dose: "50mg",  frequency: "مرتين يومياً بعد الأكل", duration: "7 أيام" },
        { drug: "Methocarbamol",     dose: "750mg", frequency: "3 مرات يومياً",           duration: "7 أيام" },
      ]),
      followUpDays: 14,
      doctorNotes:  "إجهاد عضلي في الظهر، راحة وتمارين خفيفة",
    },
  })

  // ── 7. Monthly Expenses (13 entries) ────────────────────────
  type ExpenseInput = {
    id: string
    category: string
    description: string
    amountEGP: number
    date: Date
    isRecurring: boolean
    isPaid: boolean
    staffName?: string
    staffRole?: string
    usefulLifeMonths?: number
  }

  const expenses: ExpenseInput[] = [
    // January 2026
    { id: "exp-001", category: "rent",      description: "إيجار العيادة - يناير 2026",  amountEGP: 8000, date: new Date("2026-01-01"), isRecurring: true,  isPaid: true  },
    { id: "exp-002", category: "utilities", description: "كهرباء وغاز - يناير 2026",    amountEGP: 1200, date: new Date("2026-01-05"), isRecurring: true,  isPaid: true  },
    { id: "exp-003", category: "salary",    description: "راتب التمريض - يناير",         amountEGP: 3500, date: new Date("2026-01-31"), isRecurring: true,  isPaid: true,  staffName: "Nurse Mona", staffRole: "nurse" },
    { id: "exp-004", category: "supplies",  description: "مستلزمات طبية - يناير",        amountEGP: 2200, date: new Date("2026-01-10"), isRecurring: false, isPaid: true  },
    { id: "exp-005", category: "equipment", description: "جهاز ضغط دم رقمي",            amountEGP: 1800, date: new Date("2026-01-15"), isRecurring: false, isPaid: true,  usefulLifeMonths: 60 },
    // February 2026
    { id: "exp-006", category: "rent",      description: "إيجار العيادة - فبراير 2026", amountEGP: 8000, date: new Date("2026-02-01"), isRecurring: true,  isPaid: true  },
    { id: "exp-007", category: "utilities", description: "كهرباء وغاز - فبراير 2026",   amountEGP: 1100, date: new Date("2026-02-05"), isRecurring: true,  isPaid: true  },
    { id: "exp-008", category: "salary",    description: "راتب التمريض - فبراير",        amountEGP: 3500, date: new Date("2026-02-28"), isRecurring: true,  isPaid: true,  staffName: "Nurse Mona", staffRole: "nurse" },
    { id: "exp-009", category: "supplies",  description: "مستلزمات طبية - فبراير",       amountEGP: 1800, date: new Date("2026-02-10"), isRecurring: false, isPaid: true  },
    // March 2026
    { id: "exp-010", category: "rent",      description: "إيجار العيادة - مارس 2026",   amountEGP: 8000, date: new Date("2026-03-01"), isRecurring: true,  isPaid: false },
    { id: "exp-011", category: "utilities", description: "كهرباء وغاز - مارس 2026",     amountEGP: 1300, date: new Date("2026-03-05"), isRecurring: true,  isPaid: false },
    { id: "exp-012", category: "salary",    description: "راتب التمريض - مارس",          amountEGP: 3500, date: new Date("2026-03-31"), isRecurring: true,  isPaid: false, staffName: "Nurse Mona", staffRole: "nurse" },
    { id: "exp-013", category: "supplies",  description: "مستلزمات طبية - مارس",         amountEGP: 2500, date: new Date("2026-03-10"), isRecurring: false, isPaid: false },
  ]

  for (const exp of expenses) {
    await prisma.expense.upsert({
      where:  { id: exp.id },
      update: {},
      create: { ...exp, clinicId: clinic.id },
    })
  }

  // ── 8. Auditor Logs (5 total) ────────────────────────────────
  type AuditorInput = {
    id: string
    doctorId: string
    date: Date
    patientsExpected: number
    expectedCashEGP: number
    reportedCashEGP: number
    discrepancyEGP: number
    discrepancyPct: number
    status: string
    notes?: string
  }

  const auditorLogs: AuditorInput[] = [
    {
      id:               "audit-001",
      doctorId:         doctorAhmed.id,
      date:             new Date("2026-01-15"),
      patientsExpected: 8,
      expectedCashEGP:  2400,
      reportedCashEGP:  2400,
      discrepancyEGP:   0,
      discrepancyPct:   0.0,
      status:           "green",
      notes:            "لا توجد فروق — كل المبالغ متطابقة",
    },
    {
      id:               "audit-002",
      doctorId:         doctorAhmed.id,
      date:             new Date("2026-02-03"),
      patientsExpected: 10,
      expectedCashEGP:  3000,
      reportedCashEGP:  2700,
      discrepancyEGP:   300,
      discrepancyPct:   10.0,
      status:           "amber",
      notes:            "نقص 300 جنيه، يحتمل خطأ في التسجيل أو تأجيل دفع",
    },
    {
      id:               "audit-003",
      doctorId:         doctorSara.id,
      date:             new Date("2026-02-10"),
      patientsExpected: 6,
      expectedCashEGP:  2100,
      reportedCashEGP:  2100,
      discrepancyEGP:   0,
      discrepancyPct:   0.0,
      status:           "green",
      notes:            "المبالغ متطابقة تماماً",
    },
    {
      id:               "audit-004",
      doctorId:         doctorAhmed.id,
      date:             new Date("2026-02-26"),
      patientsExpected: 9,
      expectedCashEGP:  2700,
      reportedCashEGP:  2100,
      discrepancyEGP:   600,
      discrepancyPct:   22.2,
      status:           "red",
      notes:            "فرق كبير 600 جنيه — يحتاج مراجعة عاجلة مع المساعد",
    },
    {
      id:               "audit-005",
      doctorId:         doctorAhmed.id,
      date:             new Date("2026-03-03"),
      patientsExpected: 7,
      expectedCashEGP:  2100,
      reportedCashEGP:  2050,
      discrepancyEGP:   50,
      discrepancyPct:   2.4,
      status:           "amber",
      notes:            "فرق بسيط 50 جنيه — يحتمل صرف كسور أو خطأ حساب",
    },
  ]

  for (const log of auditorLogs) {
    await prisma.auditorLog.upsert({
      where:  { id: log.id },
      update: {},
      create: log,
    })
  }

  // ── Summary ──────────────────────────────────────────────────
  console.log("✓ Clinic:       ", clinic.name)
  console.log("✓ Doctors:       Dr. Ahmed Mahmoud (GP, admin) | Dr. Sara Hassan (Gynecology)")
  console.log("✓ Patients:      10")
  console.log("✓ Conditions:    3  (diabetes, hypertension, cardiac)")
  console.log("✓ Appointments:  21 (5 scheduled | 13 arrived | 1 noshow | 1 cancelled | 1 walkin)")
  console.log("✓ Visit Records: 15")
  console.log("✓ Expenses:      13 (Jan–Mar 2026, rent/utilities/salary/supplies/equipment)")
  console.log("✓ Auditor Logs:  5  (2 green | 2 amber | 1 red)")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
