"use client";

import { useCallback, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getSuppliersAction } from "@/lib/actions/pharmacy/supplier.action";

import { SupplierForm } from "./supplier-form";
import { SuppliersTable, type Supplier } from "./suppliers-table";

interface SuppliersViewProps {
    initialSuppliers: Supplier[];
}

export function SuppliersView({ initialSuppliers }: SuppliersViewProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(
        undefined
    );

    const loadSuppliers = useCallback(async () => {
        setLoading(true);

        try {
            const result = await getSuppliersAction();

            if (!result.success) {
                toast.error(result.error || "Failed to load suppliers");
                return;
            }

            setSuppliers(
                result.suppliers.map((supplier) => ({
                    ...supplier,
                    created_at: supplier.created_at.toISOString(),
                }))
            );
        } catch (error) {
            console.error(error);
            toast.error("Failed to load suppliers");
        } finally {
            setLoading(false);
        }
    }, []);

    function handleAdd() {
        setEditingSupplier(undefined);
        setShowForm(true);
    }

    function handleEdit(supplier: Supplier) {
        setEditingSupplier(supplier);
        setShowForm(true);
    }

    function handleFormSuccess() {
        setShowForm(false);
        setEditingSupplier(undefined);
        void loadSuppliers();
    }

    function handleCloseForm() {
        setShowForm(false);
        setEditingSupplier(undefined);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Suppliers
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage pharmacy medicine suppliers
                    </p>
                </div>

                <Button onClick={handleAdd} className="rounded-xl">
                    <Plus data-icon="inline-start" className="h-4 w-4" />
                    Add Supplier
                </Button>
            </div>

            {showForm && (
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold">
                                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {editingSupplier
                                    ? "Update supplier information"
                                    : "Enter supplier information"}
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Close supplier form"
                            onClick={handleCloseForm}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <SupplierForm
                        supplier={editingSupplier}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            )}

            {loading ? (
                <div className="rounded-2xl border p-12 text-center">
                    <p className="text-sm text-muted-foreground">Loading suppliers...</p>
                </div>
            ) : (
                <SuppliersTable
                    suppliers={suppliers}
                    onEdit={handleEdit}
                    onSuccess={loadSuppliers}
                />
            )}
        </div>
    );
}