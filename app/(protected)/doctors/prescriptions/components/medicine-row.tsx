"use client";

type Medicine = {
  id: string;
  name: string;
  generic_name: string | null;
  unit: string;
  category: string | null;
};

export type MedicineRowData = {
  medicine_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
};

type Props = {
  index: number;
  row: MedicineRowData;
  medicines: Medicine[];
  canRemove: boolean;

  onChange: (
    index: number,
    field: keyof MedicineRowData,
    value: string
  ) => void;

  onRemove: (index: number) => void;
};

export default function MedicineRow({
  index,
  row,
  medicines,
  canRemove,
  onChange,
  onRemove,
}: Props) {
  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            Medicine {index + 1}
          </h3>

          <p className="text-xs text-gray-500">
            Enter medicine instructions
          </p>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Medicine */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Medicine
          </label>

          <select
            value={row.medicine_id}
            onChange={(e) =>
              onChange(
                index,
                "medicine_id",
                e.target.value
              )
            }
            className="w-full rounded-lg border bg-white px-3 py-2.5 outline-none focus:border-blue-500"
            required
          >
            <option value="">
              Select medicine
            </option>

            {medicines.map((medicine) => (
              <option
                key={medicine.id}
                value={medicine.id}
              >
                {medicine.name}
                {medicine.generic_name
                  ? ` (${medicine.generic_name})`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Dosage */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Dosage
          </label>

          <input
            type="text"
            value={row.dosage}
            onChange={(e) =>
              onChange(
                index,
                "dosage",
                e.target.value
              )
            }
            placeholder="e.g. 500 mg"
            className="w-full rounded-lg border bg-white px-3 py-2.5 outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Frequency
          </label>

          <select
            value={row.frequency}
            onChange={(e) =>
              onChange(
                index,
                "frequency",
                e.target.value
              )
            }
            className="w-full rounded-lg border bg-white px-3 py-2.5 outline-none focus:border-blue-500"
            required
          >
            <option value="">
              Select frequency
            </option>

            <option value="Once daily">
              Once daily
            </option>

            <option value="Twice daily">
              Twice daily
            </option>

            <option value="Three times daily">
              Three times daily
            </option>

            <option value="Four times daily">
              Four times daily
            </option>

            <option value="Every 4 hours">
              Every 4 hours
            </option>

            <option value="Every 6 hours">
              Every 6 hours
            </option>

            <option value="Every 8 hours">
              Every 8 hours
            </option>

            <option value="Every 12 hours">
              Every 12 hours
            </option>

            <option value="As needed">
              As needed
            </option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Duration
          </label>

          <input
            type="text"
            value={row.duration}
            onChange={(e) =>
              onChange(
                index,
                "duration",
                e.target.value
              )
            }
            placeholder="e.g. 5 days"
            className="w-full rounded-lg border bg-white px-3 py-2.5 outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Quantity
          </label>

          <input
            type="number"
            min="1"
            value={row.quantity}
            onChange={(e) =>
              onChange(
                index,
                "quantity",
                e.target.value
              )
            }
            placeholder="e.g. 10"
            className="w-full rounded-lg border bg-white px-3 py-2.5 outline-none focus:border-blue-500"
            required
          />
        </div>
      </div>
    </div>
  );
}