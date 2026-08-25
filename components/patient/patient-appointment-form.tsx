"use client";

import { useMemo, useState, useEffect } from "react";
import { useActionState } from "react";
import { CalendarDays, Clock, Stethoscope } from "lucide-react";

import { createAppointment, type AppointmentState } from "@/app/(protected)/patient/appointments/new/actions";

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

type Props = {
  patientId: string;
  patientName: string;
  patientNumber: string;
  doctors: DoctorOption[];
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

export function PatientAppointmentForm({
  patientId,
  patientName,
  patientNumber,
  doctors,
}: Props) {
  const [state, formAction, pending] = useActionState<
    AppointmentState,
    FormData
  >(createAppointment, {});

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

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        doctors
          .map((doctor) => doctor.department)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(
      (doctor) => !department || doctor.department === department
    );
  }, [doctors, department]);

  const slots = useMemo(() => {
    if (!doctorId || !date) return [];

    const doctor = doctors.find((entry) => entry.id === doctorId);
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
            Booking for{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {patientName}
            </span>{" "}
            · Patient ID: {patientNumber}
          </p>
        </div>
      </div>

      {state?.error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div className="space-y-6">
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
              Doctor
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

        <div>
          <label
            htmlFor="appointmentDate"
            className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Appointment Date
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

        <div>
          <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
            Available Time
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

        <div>
          <label
            htmlFor="type"
            className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Appointment Type
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
          </select>
        </div>

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
            placeholder="Briefly describe why you want to see the doctor..."
            className={`${fieldClass} resize-none`}
          />
        </div>

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
            placeholder="Any additional information for the hospital..."
            className={`${fieldClass} resize-none`}
          />
        </div>

        {!time && (
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Select an available time to continue.
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !time}
          className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Booking..." : "Book Appointment"}
        </button>
      </div>
    </form>
  );
}
