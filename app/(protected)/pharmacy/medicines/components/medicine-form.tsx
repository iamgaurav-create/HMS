"use client";
import { useState } from "react";
import { toast } from "sonner";
import { createMedicineAction, updateMedicineAction } from "@/lib/actions/pharmacy/medicine.action";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import type { Medicine } from "./medicine-table";

interface MedicineFormProps{
    medicine?: Medicine;
    onSuccess?:()=>void;
}

export function MedicineForm({
    medicine,
    onSuccess,
}: MedicineFormProps){
    const [loading, setLoading] =useState(false);
    const [isOtc, setIsOtc] = useState<boolean>(medicine?.is_otc ?? false);
    const isEditing =Boolean(medicine);

    async function handleSubmit(formData: FormData){
        setLoading(true);

        try{
            formData.set("is_otc", isOtc ? "on" : "false");
            const result = isEditing
            ? await updateMedicineAction(medicine!.id, formData)
            : await createMedicineAction(formData);

            if(!result.success){
                toast.error(result.error || "Something went wrong");
                return;
            }
            toast.success(result.message || (isEditing 
                ? "Medicine updated Successfully"
                : "Medicine Created Successfully"
            ) );
            onSuccess?.();
        }catch(error){
            console.error(error);
            toast.error("Something went wrong. Please try again");
        }finally{
            setLoading(false);
        }
    }

    return(
        <form action={handleSubmit} className="space-y-6">
        <div className="space-y-2">
        <Label htmlFor="name">
          Medicine Name <span className="text-red-500">*</span>
        </Label>

        <Input
          id="name"
          name="name"
          placeholder="Enter medicine name eg: Paracetamol"
          defaultValue={medicine?.name || ""}
          required
          className="rounded-xl"
        />
        </div>

         <div className="space-y-2">
        <Label htmlFor="generic_name">
          Generic Name <span className="text-red-500">*</span>
        </Label>

        <Input
          id="generic_name"
          name="generic_name"
          placeholder="e.g. Paracetamol"
          defaultValue={medicine?.generic_name || ""}
          required
          className="rounded-xl"
        />
      </div>

           <div className="space-y-2">
        <Label htmlFor="category">
          Category <span className="text-red-500">*</span>
        </Label>

        <Input
          id="category"
          name="category"
          placeholder="e.g. Analgesic"
          defaultValue={medicine?.category || ""}
          required
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="manufacturer">
          Manufacturer <span className="text-red-500">*</span>
        </Label>

        <Input
          id="manufacturer"
          name="manufacturer"
          placeholder="e.g. ABC Pharma"
          defaultValue={medicine?.manufacturer || ""}
          required
          className="rounded-xl"
        />
      </div>

        <div className="space-y-2">
        <Label htmlFor="unit">
          Unit <span className="text-red-500">*</span>
        </Label>

        <select
          id="unit"
          name="unit"
          defaultValue={medicine?.unit || ""}
          required
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select unit</option>
          <option value="Tablet">Tablet</option>
          <option value="Capsule">Capsule</option>
          <option value="Syrup">Syrup</option>
          <option value="Injection">Injection</option>
          <option value="Bottle">Bottle</option>
          <option value="Tube">Tube</option>
          <option value="Strip">Strip</option>
          <option value="Sachet">Sachet</option>
          <option value="Piece">Piece</option>
        </select>
      </div>

        <div className="space-y-2">
        <Label htmlFor="reorder_level">
          Reorder Level
        </Label>

        <Input
          id="reorder_level"
          name="reorder_level"
          type="number"
          min="0"
          defaultValue={medicine?.reorder_level ?? 10}
          required
          className="rounded-xl"
        />

        <p className="text-xs text-muted-foreground">
          You will receive a low-stock warning when inventory
          reaches this level.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_otc"
          name="is_otc"
          checked={isOtc}
          onCheckedChange={(checked) => setIsOtc(Boolean(checked))}
        />
        <Label htmlFor="is_otc" className="text-sm font-medium leading-none cursor-pointer">
          Over-the-Counter (OTC)
        </Label>
        <p className="text-xs text-muted-foreground">
          Enable this to allow walk-in sales without prescription.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="rounded-xl"
        >
          {loading
            ? "Saving..."
            : isEditing
              ? "Update Medicine"
              : "Add Medicine"}
        </Button>
      </div>

        </form>
    )
}

