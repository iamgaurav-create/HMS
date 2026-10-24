import db from "@/lib/db";

const AUTO_REJECT_NOTE =
  "Auto-rejected: the appointment date and time passed without confirmation.";

const EXPIRING_STATUSES = ["Pending"] as const;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * Appointment dates are stored as UTC midnight of the booked day, so the
 * calendar day is read from the UTC parts. The wall-clock slot is kept in the
 * free-text `time` column, so expiry is compared against local wall-clock time.
 */
function bookedDayKey(appointmentDate: Date) {
  return `${appointmentDate.getUTCFullYear()}-${pad(appointmentDate.getUTCMonth() + 1)}-${pad(
    appointmentDate.getUTCDate()
  )}`;
}

function slotTimeKey(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return "23:59";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return "23:59";
  return `${pad(hours)}:${pad(minutes)}`;
}

function hasSlotPassed(
  appointmentDate: Date,
  time: string,
  todayKey: string,
  currentTimeKey: string
) {
  const dayKey = bookedDayKey(appointmentDate);
  if (dayKey < todayKey) return true;
  if (dayKey > todayKey) return false;
  return slotTimeKey(time) <= currentTimeKey;
}

export function getExpiryClock(now = new Date()) {
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const currentTimeKey = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const endOfTodayUtc = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  );
  return { todayKey, currentTimeKey, endOfTodayUtc };
}

/**
 * Rejects every appointment request whose booked date/time has already passed.
 * Safe to call repeatedly: only still-pending rows on or before today are read,
 * and each row is re-checked in JavaScript before it is transitioned.
 */
export async function expireElapsedAppointments(now = new Date()) {
  const { todayKey, currentTimeKey, endOfTodayUtc } = getExpiryClock(now);

  const candidates = await db.appointment.findMany({
    where: {
      status: { in: [...EXPIRING_STATUSES] },
      appointment_date: { lte: endOfTodayUtc },
    },
    select: {
      id: true,
      appointment_date: true,
      time: true,
      note: true,
      patient_id: true,
      patient: { select: { first_name: true, last_name: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  const expired = candidates.filter((appointment) =>
    hasSlotPassed(appointment.appointment_date, appointment.time, todayKey, currentTimeKey)
  );

  const rejected: number[] = [];

  for (const appointment of expired) {
    try {
      const result = await db.appointment.updateMany({
        where: { id: appointment.id, status: { in: [...EXPIRING_STATUSES] } },
        data: {
          status: "Cancelled",
          note: appointment.note
            ? `${appointment.note}\n${AUTO_REJECT_NOTE}`
            : AUTO_REJECT_NOTE,
        },
      });

      if (result.count === 0) continue;

      rejected.push(appointment.id);

      const dateLabel = appointment.appointment_date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
      const patientName = `${appointment.patient.first_name} ${appointment.patient.last_name}`;

      await db.notification.createMany({
        data: [
          {
            user_id: appointment.patient_id,
            title: "Appointment Rejected / Cancelled",
            message: `Your appointment request with Dr. ${appointment.doctor.name} on ${dateLabel} at ${appointment.time} expired and was rejected automatically.`,
            type: "appointment",
            link: "/patient/appointments",
          },
          {
            user_id: appointment.doctor.id,
            title: "Appointment Cancelled",
            message: `Appointment for ${patientName} on ${dateLabel} at ${appointment.time} expired and was cancelled automatically.`,
            type: "appointment",
            link: "/dashboard?role=Doctor",
          },
        ],
      });
    } catch (error) {
      console.error(`Failed to auto-reject appointment ${appointment.id}:`, error);
    }
  }

  return rejected.length;
}