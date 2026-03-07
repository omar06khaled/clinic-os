// ─── Patient types ────────────────────────────────────────────────────────────

export type PatientCondition = {
  id: string
  type: string // diabetes | hypertension | cardiac | thyroid | other
  notes: string | null
}

/** Serialized patient row returned by GET /api/patients and used by the patient list UI */
export type PatientListItem = {
  id: string
  name: string
  phone: string
  age: number | null
  gender: string | null
  isNew: boolean
  createdAt: string // ISO string
  conditions: PatientCondition[]
  /** ISO string of most recent VisitRecord.createdAt, or null if no visits */
  lastVisitDate: string | null
  /** Total number of VisitRecords */
  totalVisits: number
  /** Sum of amountPaid on Appointments where paymentStatus = "pending" (EGP) */
  outstandingBalance: number
}

// ─── Patient Detail types (Task 3.2) ─────────────────────────────────────────

export type ConditionDetail = {
  id: string
  type: string // diabetes | hypertension | cardiac | thyroid | other
  notes: string | null
  addedAt: string // ISO string
}

export type AttachmentItem = {
  id: string
  url: string
  type: string // image | pdf
  name: string
}

export type PrescriptionItem = {
  drug: string
  dose: string
  frequency: string
  duration: string
}

export type LabReferral = {
  test: string
  lab: string
  notes: string
  received: boolean
}

export type RecordAppointment = {
  scheduledAt: string // ISO string
  paymentStatus: string
  amountPaid: number | null
}

export type VisitRecordDetail = {
  id: string
  appointmentId: string
  complaint: string | null
  vitalsBP: string | null       // "120/80"
  vitalsPulse: number | null
  vitalsTemp: number | null
  vitalsWeight: number | null
  vitalsO2: number | null
  symptoms: string | null       // JSON array string
  diagnosis: string | null
  prescription: string | null   // JSON array string
  labReferrals: string | null   // JSON array string
  followUpDays: number | null
  followUpReason: string | null
  doctorNotes: string | null
  voiceNoteUrl: string | null
  createdAt: string             // ISO string
  attachments: AttachmentItem[]
  appointment: RecordAppointment
}

export type PatientDetail = {
  id: string
  name: string
  phone: string
  age: number | null
  gender: string | null
  bloodType: string | null
  allergies: string | null
  permanentNotes: string | null
  isNew: boolean
  createdAt: string // ISO string
  conditions: ConditionDetail[]
  records: VisitRecordDetail[]  // sorted DESC (most recent first)
  totalVisits: number
  totalSpent: number            // EGP
  lastVisitDate: string | null  // ISO string of most recent appointment.scheduledAt
}
