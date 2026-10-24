"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Select from "react-select";
import { createPrescriptionAction } from "@/lib/actions/doctor/prescription.actions";

type Patient = {
  id: string;
  patientNumber: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  gender: string;
};

type Medicine = {
  id: string;
  name: string;
  generic_name: string | null;
  unit: string;
  category: string | null;
};

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  license_number: string;
  phone: string;
} | null;

type MedicineRow = {
  medicine_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
};

type Props = {
  patients: Patient[];
  medicines: Medicine[];
  doctor: Doctor;
  preselectedPatientId?: string;
};

export default function PrescriptionForm({
  patients,
  medicines,
  doctor,
  preselectedPatientId = "",
}: Props) {
  const router = useRouter();
  const [patientId, setPatientId] = useState(preselectedPatientId);
  const [notes, setNotes] = useState("");
  const patientOptions = patients.map((patient) => ({
    value: patient.id,
    label: `${patient.first_name} ${patient.last_name} (${patient.patientNumber})`,
  }));
  const [medicineRow, setMedicineRow] = useState<MedicineRow[]>([
    {
      medicine_id: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: "",
    },
  ]);
  const [loading, setLoading] = useState(false);

  function addMedicine() {
    setMedicineRow((prev) => [
      ...prev,
      {
        medicine_id: "",
        dosage: "",
        frequency: "",
        duration: "",
        quantity: "",
      },
    ]);
  }
  function removeMedicine(index: number) {
    setMedicineRow((prev) => prev.filter((_, i) => i !== index));
  }
  function updateMedicine(
    index: number,
    field: keyof MedicineRow,
    value: string,
  ) {
    setMedicineRow((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!patientId) {
      toast.error("Please select a Patient");
      return;
    }
    if (medicineRow.length === 0) {
      toast.error("Add atleast one medicine");
      return;
    }
    const selectedIds = medicineRow
      .map((row) => row.medicine_id)
      .filter(Boolean);
    if (selectedIds.length !== new Set(selectedIds).size) {
      toast.error("same medicine cannot be added twice");
      return;
    }
    for (const row of medicineRow) {
      if (!row.medicine_id) {
        toast.error("Please select medicine");
        return;
      }
      if (!row.dosage.trim()) {
        toast.error("Enter dosage");
        return;
      }
      if (!row.frequency.trim()) {
        toast.error("Enter frequency");
        return;
      }

      if (!row.duration.trim()) {
        toast.error("Enter duration");
        return;
      }

      if (!row.quantity || Number(row.quantity) <= 0) {
        toast.error("Enter valid quantity");
        return;
      }
    }

    try {
      setLoading(true);
      const result = await createPrescriptionAction({
        patient_id: patientId,
        notes,
        medicines: medicineRow.map((row) => ({
          medicine_id: row.medicine_id,
          dosage: row.dosage,
          frequency: row.frequency,
          duration: row.duration,
          quantity: Number(row.quantity),
        })),
      });
      if (result.success) {
        toast.success("Prescription created successfully");
        router.push(
          preselectedPatientId
            ? `/patients/${preselectedPatientId}`
            : "/doctors/prescriptions",
        );
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create Prescription",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Doctor Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {doctor ? `Dr. ${doctor.name}` : "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Specialization
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {doctor?.specialization || "N/A"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              License Number
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {doctor?.license_number || "N/A"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {doctor?.phone || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Patient Information
        </h2>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Patient
          </label>

          <Select
            options={patientOptions}
            value={
              patientOptions.find((option) => option.value === patientId) ||
              null
            }
            onChange={(selectedOption) =>
              setPatientId(selectedOption?.value || "")
            }
            placeholder="Search patient..."
            isSearchable
            isClearable
            noOptionsMessage={() => "No patient found"}
            classNames={{
              control: ({ isFocused }) =>
                `min-h-[42px] rounded-lg border ${
                  isFocused
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-gray-300 dark:border-slate-700"
                } bg-white dark:bg-slate-900`,
              input: () => "text-sm text-gray-900 dark:text-slate-100",
              singleValue: () => "text-gray-900 dark:text-slate-100",
              placeholder: () => "text-gray-400 dark:text-slate-400",
              menu: () =>
                "z-50 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900",
              menuList: () => "bg-white dark:bg-slate-900",
              option: ({ isFocused, isSelected }) =>
                `cursor-pointer px-3 py-2 ${
                  isSelected
                    ? "bg-blue-600 text-white dark:bg-sky-600"
                    : isFocused
                      ? "bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-slate-100"
                      : "text-gray-900 dark:text-slate-200"
                }`,
              clearIndicator: () =>
                "text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200",
              dropdownIndicator: () =>
                "text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200",
            }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Medicines
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add medicines prescribed to the patient
            </p>
          </div>

          <button
            type="button"
            onClick={addMedicine}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            + Add Medicine
          </button>
        </div>

        <div className="space-y-5">
          {medicineRow.map((row, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Medicine {index + 1}
                </h3>

                {medicineRow.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Medicine
                  </label>

                  <select
                    value={row.medicine_id}
                    onChange={(e) =>
                      updateMedicine(index, "medicine_id", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    required
                  >
                    <option value="">Select medicine</option>

                    {medicines.map((medicine) => (
                      <option key={medicine.id} value={medicine.id}>
                        {medicine.name}
                        {medicine.generic_name
                          ? ` (${medicine.generic_name})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dosage
                  </label>

                  <input
                    value={row.dosage}
                    onChange={(e) =>
                      updateMedicine(index, "dosage", e.target.value)
                    }
                    placeholder="e.g. 500 mg"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Frequency
                  </label>

                  <select
                    value={row.frequency}
                    onChange={(e) =>
                      updateMedicine(index, "frequency", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    required
                  >
                    <option value="">Select frequency</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="Every 4 hours">Every 4 hours</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="Every 12 hours">Every 12 hours</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duration
                  </label>

                  <input
                    value={row.duration}
                    onChange={(e) =>
                      updateMedicine(index, "duration", e.target.value)
                    }
                    placeholder="e.g. 5 days"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) =>
                      updateMedicine(index, "quantity", e.target.value)
                    }
                    placeholder="e.g. 10"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Instructions / Notes
        </h2>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Additional instructions for the patient..."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(
              preselectedPatientId
                ? `/patients/${preselectedPatientId}`
                : "/doctors/prescriptions",
            )
          }
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Prescription"}
        </button>
      </div>
    </form>
  );
}
