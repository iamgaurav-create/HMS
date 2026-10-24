"use client";

import { useCallback, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getMedicinesAction } from "@/lib/actions/pharmacy/medicine.action";

import { MedicineForm } from "./medicine-form";
import { MedicineTable, type Medicine } from "./medicine-table";

interface MedicinesViewProps {
  initialMedicines: Medicine[];
}

export function MedicinesView({ initialMedicines }: MedicinesViewProps) {
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | undefined>(
    undefined
  );

  const loadMedicines = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getMedicinesAction();

      if (!result.success) {
        toast.error(result.error || "Failed to load medicines");
        return;
      }

      setMedicines(
        result.medicines.map((medicine) => ({
          ...medicine,
          created_at: medicine.created_at.toISOString(),
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleAdd() {
    setEditingMedicine(undefined);
    setShowForm(true);
  }

  function handleEdit(medicine: Medicine) {
    setEditingMedicine(medicine);
    setShowForm(true);
  }

  function handleFormSuccess() {
    setShowForm(false);
    setEditingMedicine(undefined);
    void loadMedicines();
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingMedicine(undefined);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Medicines
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage medicines available in the hospital pharmacy.
          </p>
        </div>

        <Button onClick={handleAdd} className="rounded-xl">
          <Plus data-icon="inline-start" className="h-4 w-4" />
          Add Medicine
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-background p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {editingMedicine
                  ? "Update medicine information"
                  : "Enter medicine information"}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Close medicine form"
              onClick={handleCloseForm}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <MedicineForm
            medicine={editingMedicine}
            onSuccess={handleFormSuccess}
          />
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border p-12 text-center">
          <p className="text-sm text-muted-foreground">Loading medicines...</p>
        </div>
      ) : (
        <MedicineTable
          medicines={medicines}
          onEdit={handleEdit}
          onSuccess={loadMedicines}
        />
      )}
    </div>
  );
}