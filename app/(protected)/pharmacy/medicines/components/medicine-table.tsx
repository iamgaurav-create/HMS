"use client";

import { toggleMedicineStatusAction } from "@/lib/actions/pharmacy/medicine.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Pill, Power, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export type Medicine = {
    id: string;
    name: string;
    generic_name: string | null;
    category: string | null;
    manufacturer: string | null;
    unit: string;
    reorder_level: number;
    is_active: boolean;
    is_otc: boolean;
    created_at: string;
}

interface MedicineTableProps {
    medicines?: Medicine[];
    onEdit?: (medicine: Medicine) => void;
    onSuccess?: () => void;
}

export function MedicineTable({
    medicines = [],
    onEdit,
    onSuccess,
}: MedicineTableProps) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState<string | null>(null);

    const filteredMedicines = useMemo(() => {
        const searchText = search.toLowerCase();

        return medicines.filter((medicine) => {
            const matchesSearch =
                !searchText ||
                medicine.name.toLowerCase().includes(searchText) ||
                (medicine.generic_name ?? "").toLowerCase().includes(searchText) ||
                (medicine.manufacturer ?? "").toLowerCase().includes(searchText);

            const matchesStatus =
                status === "all" ||
                (status === "active" && medicine.is_active) ||
                (status === "inactive" && !medicine.is_active);

            return matchesSearch && matchesStatus;
        });
    }, [medicines, search, status]);


    async function handleToggle(id: string){
        setLoading(id);
        try{
            const result =
            await toggleMedicineStatusAction(id);
            if(!result.success){
                toast.error(result.error || "Failed to update medicine status");
                return;
            }
            toast.success(result.message);
            onSuccess?.();
        }
        catch(error){
            console.error(error);
            toast.error("Something went wrong. Please try again");
        } finally{
            setLoading(null);
        }
    }

 return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      {/* Header */}
      <div className="border-b p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">
              Medicines
            </h2>

            <p className="text-sm text-muted-foreground">
              Manage hospital medicines
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search medicines..."
                className="w-full rounded-xl pl-9 sm:w-64"
              />
            </div>

            {/* Status */}
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              className="h-10 rounded-xl border bg-background px-3 text-sm"
            >
              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider">
                Medicine
              </th>

              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                Generic Name
              </th>

              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                Category
              </th>

              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                Unit
              </th>

              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                Reorder Level
              </th>

<th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                 Status
               </th>

               <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                 OTC
               </th>

               <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider">
                 Actions
               </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filteredMedicines.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-16 text-center"
                >
                  <div className="flex flex-col items-center">
                    <Pill className="mb-3 h-8 w-8 text-muted-foreground" />

                    <p className="font-semibold">
                      No medicines found
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Try changing your search or filter.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMedicines.map((medicine) => (
                <tr
                  key={medicine.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Pill className="h-4 w-4 text-primary" />
                      </div>

                      <div>
                        <p className="font-semibold">
                          {medicine.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {medicine.manufacturer ||
                            "No manufacturer"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm">
                    {medicine.generic_name || "—"}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    {medicine.category || "—"}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    {medicine.unit}
                  </td>

                  <td className="px-4 py-4 text-sm font-medium">
                    {medicine.reorder_level}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        medicine.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {medicine.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        medicine.is_otc
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {medicine.is_otc ? "Yes" : "No"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-lg"
                        disabled={loading === medicine.id}
                        aria-label={
                          medicine.is_active
                            ? `Deactivate ${medicine.name}`
                            : `Activate ${medicine.name}`
                        }
                        onClick={() =>
                          onEdit?.(medicine)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-lg"
                        disabled={loading === medicine.id}
                        aria-label={
                          medicine.is_active
                            ? `Deactivate ${medicine.name}`
                            : `Activate ${medicine.name}`
                        }
                        onClick={() =>
                          handleToggle(medicine.id)
                        }
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t px-5 py-3">
        <p className="text-xs text-muted-foreground">
          Showing {filteredMedicines.length} of{" "}
          {medicines.length} medicines
        </p>
      </div>
    </div>
  );
}