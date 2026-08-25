"use client";

import { useMemo, useState, useEffect } from "react";
import { useActionState } from "react";
import { CalendarDays, Clock, Stethoscope, User, Search } from "lucide-react";

import {
  createAppointmentByReceptionist,
  type ReceptionistAppointmentState,
} from "@/app/(protected)/receptionist/appointments/new/actions";

type WorkingDay = {
  day: string;
  start_time: string;
  close_time: string;
};

export type DoctorOption = {
  id: string;
  name: string;
  specialization: string;
  department: string | null;
  availability_status: string | null;
  working_days: WorkingDay[];
};

export type PatientOption = {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  email: string;
  phone: string;
};

type Props = {
  doctors: DoctorOption[];
  patients: PatientOption[];
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function normalizeDay(value: string): string {
  const name = value.trim().toLowerCase();
  const idx = DAY_KEYS.findIndex((key) => name.startsWith(key));
  return idx >= 0 ? DAY_KEYS[idx] : "";
}

function dateKey(value: string): string {
  const d = new Date(`${value}T00:00:00Z`);
  const idx = d.getUTCDay();
  return DAY_KEYS[idx] ?? "";
}

function generateSlots(start: string, end: string): string[] {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return [];

  const slots: string[] = [];
  let cursor = sh * 60 + sm;
  const stop = eh * 60 + em;

  while (cursor + 30 <= stop) {
    const h = Math.floor(cursor / 60);
    const m = cursor % 60;
    slots.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
    cursor += 30;
  }

  return slots;
}

export function ReceptionistAppointmentForm({
  doctors,
  patients,
}: Props) {
  const [state, formAction, pending] = useActionState<
    ReceptionistAppointmentState,
    FormData
  >(createAppointmentByReceptionist, {});

  const [patientSearch, setPatientSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [department, setDepartment] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    setMinDate(`${y}-${m}-${d}`);
  }, []);

  const selectedPatient = patients.find((p) => p.id === patientId);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 10);
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.patientNumber.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [patients, patientSearch]);

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        doctors
          .map((d) => d.department)
          .filter((v): v is string => Boolean(v))
      )
    ).sort();
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(
      (d) => !department || d.department === department
    );
  }, [doctors, department]);

  const slots = useMemo(() => {
    if (!doctorId || !date) return [];

    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor) return [];

    const workingDay = doctor.working_days.find(
      (entry) => normalizeDay(entry.day) === dateKey(date)
    );

    if (workingDay?.start_time && workingDay?.close_time) {
      return generateSlots(workingDay.start_time, workingDay.close_time);
    }

    return generateSlots("09:00", "17:00");
  }, [doctorId, date, doctors]);

  function handleDepartment(value: string) {
    setDepartment(value);
    setDoctorId("");
    setTime("");
  }

  function handleDoctor(value: string) {
    setDoctorId(value);
    setTime("");
  }

  function handleDate(value: string) {
    setDate(value);
    setTime("");
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200";

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-sky-500/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:p-8"
    >
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="time" value={time} />

      <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
          <Stethoscope className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Book Appointment
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {selectedPatient
              ? `Booking for ${selectedPatient.firstName} ${selectedPatient.lastName} · ${selectedPatient.patientNumber}`
              : "Select a patient to begin booking"}
          </p>
        </div>
      </div>

      {state?.error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div className="space-y-6">
        {/* Patient Selection */}
        <div>
          <label
            htmlFor="patientSearch"
            className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Select Patient *
            </span>
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              id="patientSearch"
              type="text"
              placeholder="Search by name, patient ID or email..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                if (patientId) setPatientId("");
              }}
              className={`${fieldClass} pl-10`}
            />
          </div>

          {!patientId && patientSearch.trim() && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {filteredPatients.length === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-400">No patients found.</p>
              ) : (
                filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPatientId(p.id);
                      setPatientSearch(`${p.firstName} ${p.lastName} (${p.patientNumber})`);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-sky-50 dark:hover:bg-slate-800"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {p.patientNumber} · {p.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {selectedPatient && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              <User className="h-3.5 w-3.5" />
              <span className="font-semibold">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </span>
              <span>·</span>
              <span>{selectedPatient.patientNumber}</span>
              <button
                type="button"
                onClick={() => {
                  setPatientId("");
                  setPatientSearch("");
                }}
                className="ml-auto text-[11px] font-bold text-sky-600 hover:underline dark:text-sky-400"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Department & Doctor */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="department"
              className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Department
            </label>

            <select
              id="department"
              value={department}
              onChange={(event) => handleDepartment(event.target.value)}
              className={fieldClass}
            >
              <option value="">Select Department</option>
              {departments.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="doctorId"
              className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Doctor *
            </label>

            <select
              id="doctorId"
              name="doctorId"
              value={doctorId}
              onChange={(event) => handleDoctor(event.target.value)}
              required
              className={fieldClass}
            >
              <option value="">Select Doctor</option>
              {filteredDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name} — {doctor.specialization}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor="appointmentDate"
            className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Appointment Date *
          </label>

          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              id="appointmentDate"
              name="appointmentDate"
              type="date"
              value={date}
              min={minDate || undefined}
              onChange={(event) => handleDate(event.target.value)}
              required
              suppressHydrationWarning
              className={`${fieldClass} pl-10`}
            />
          </div>
        </div>

        {/* Time Slots */}
        <div>
          <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
            Available Time *
          </label>

          {!doctorId || !date ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
              Select a doctor and date to see available time slots.
            </p>
          ) : slots.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
              No available time slots for the selected date.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {slots.map((slot) => {
                const selected = time === slot;

                return (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={
                      selected
                        ? "inline-flex items-center gap-2 rounded-xl border border-sky-500 bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition"
                        : "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-500"
                    }
                  >
                    <Clock className="h-4 w-4" />
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Appointment Type */}
        <div>
          <label
            htmlFor="type"
            className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Appointment Type *
          </label>

          <select
            id="type"
            name="type"
            defaultValue="Consultation"
            required
            className={fieldClass}
          >
            <option value="Consultation">Consultation</option>
            <option value="FollowUp">Follow-up</option>
            <option value="Emergency">Emergency</option>
            <option value="WalkIn">Walk-in</option>
          </select>
        </div>

        {/* Reason */}
        <div>
          <label
            htmlFor="reason"
            className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Reason for Visit
          </label>

          <textarea
            id="reason"
            name="reason"
            rows={3}
            placeholder="Briefly describe the reason for the visit..."
            className={`${fieldClass} resize-none`}
          />
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="note"
            className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Additional Notes (Optional)
          </label>

          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder="Any additional information..."
            className={`${fieldClass} resize-none`}
          />
        </div>

        {(!patientId || !time) && (
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            {!patientId
              ? "Select a patient to continue."
              : "Select an available time to continue."}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !time || !patientId}
          className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Booking..." : "Book Appointment"}
        </button>
      </div>
    </form>
  );
}
