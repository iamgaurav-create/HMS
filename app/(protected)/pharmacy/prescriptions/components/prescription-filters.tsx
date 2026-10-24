"use client";

interface PrescriptionFiltersProps {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function PrescriptionFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: PrescriptionFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by patient, doctor, or phone..."
        className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="h-10 rounded-xl border bg-background px-3 text-sm"
      >
        <option value="all">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="PARTIALLY_DISPENSED">Partially Dispensed</option>
        <option value="DISPENSED">Dispensed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    </div>
  );
}