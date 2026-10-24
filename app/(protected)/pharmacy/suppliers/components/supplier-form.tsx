"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
    createSupplierAction,
    updateSupplierAction,
} from "@/lib/actions/pharmacy/supplier.action";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { Supplier } from "./suppliers-table";

interface SupplierFormProps {
    supplier?: Supplier;
    onSuccess?: () => void;
}

export function SupplierForm({
    supplier,
    onSuccess,
}: SupplierFormProps) {
    const [loading, setLoading] = useState(false);
    const isEditing = Boolean(supplier);

    async function handleSubmit(formData: FormData) {
        setLoading(true);

        try {
            const result = isEditing
                ? await updateSupplierAction(supplier!.id, formData)
                : await createSupplierAction(formData);

            if (!result.success) {
                toast.error(result.error || "Something went wrong");
                return;
            }

            toast.success(
                result.message ||
                    (isEditing
                        ? "Supplier updated successfully"
                        : "Supplier created successfully")
            );
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">
                    Supplier Name <span className="text-red-500">*</span>
                </Label>

                <Input
                    id="name"
                    name="name"
                    placeholder="Enter supplier name eg: ABC Pharma"
                    defaultValue={supplier?.name || ""}
                    required
                    className="rounded-xl"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                </Label>

                <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. 9229******"
                    defaultValue={supplier?.phone || ""}
                    required
                    className="rounded-xl"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                </Label>

                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="e.g. contact@abcpharma.com"
                    defaultValue={supplier?.email || ""}
                    required
                    className="rounded-xl"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">
                    Address <span className="text-red-500">*</span>
                </Label>

                <Input
                    id="address"
                    name="address"
                    placeholder="e.g. 12 Market Street, Colombo"
                    defaultValue={supplier?.address || ""}
                    required
                    className="rounded-xl"
                />
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
                            ? "Update Supplier"
                            : "Add Supplier"}
                </Button>
            </div>
        </form>
    );
}