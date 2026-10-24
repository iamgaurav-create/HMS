"use client";

import { toggleSupplierStatusAction } from "@/lib/actions/pharmacy/supplier.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Pencil, Power, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export type Supplier = {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
}

interface SuppliersTableProps {
    suppliers?: Supplier[];
    onEdit?: (supplier: Supplier) => void;
    onSuccess?: () => void;
}

export function SuppliersTable({
    suppliers = [],
    onEdit,
    onSuccess,
}: SuppliersTableProps) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState<string | null>(null);

    const filteredSuppliers = useMemo(() => {
        const searchText = search.toLowerCase();

        return suppliers.filter((supplier) => {
            const matchesSearch =
                !searchText ||
                supplier.name.toLowerCase().includes(searchText) ||
                (supplier.email ?? "").toLowerCase().includes(searchText) ||
                (supplier.phone ?? "").toLowerCase().includes(searchText);

            const matchesStatus =
                status === "all" ||
                (status === "active" && supplier.is_active) ||
                (status === "inactive" && !supplier.is_active);

            return matchesSearch && matchesStatus;
        });
    }, [suppliers, search, status]);

    async function handleToggle(id: string) {
        setLoading(id);
        try {
            const result = await toggleSupplierStatusAction(id);

            if (!result.success) {
                toast.error(result.error || "Failed to update supplier status");
                return;
            }

            toast.success(result.message);
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again");
        } finally {
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
                            Suppliers
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            Manage hospital suppliers
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
                                placeholder="Search suppliers..."
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
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="border-b bg-muted/40">
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                Supplier
                            </th>

                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                Phone
                            </th>

                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                Email
                            </th>

                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                Address
                            </th>

                            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">
                                Status
                            </th>

                            <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {filteredSuppliers.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-5 py-16 text-center"
                                >
                                    <div className="flex flex-col items-center">
                                        <Building2 className="mb-3 h-8 w-8 text-muted-foreground" />

                                        <p className="font-semibold">
                                            No suppliers found
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            Try changing your search or filter.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredSuppliers.map((supplier) => (
                                <tr
                                    key={supplier.id}
                                    className="transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                                                <Building2 className="h-4 w-4 text-primary" />
                                            </div>

                                            <p className="font-semibold">
                                                {supplier.name}
                                            </p>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-sm">
                                        {supplier.phone || "—"}
                                    </td>

                                    <td className="px-4 py-4 text-sm">
                                        {supplier.email || "—"}
                                    </td>

                                    <td className="px-4 py-4 text-sm">
                                        {supplier.address || "—"}
                                    </td>

                                    <td className="px-4 py-4">
                                        <span
                                            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                                supplier.is_active
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {supplier.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-lg"
                                                aria-label={`Edit ${supplier.name}`}
                                                onClick={() =>
                                                    onEdit?.(supplier)
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-lg"
                                                disabled={loading === supplier.id}
                                                aria-label={
                                                    supplier.is_active
                                                        ? `Deactivate ${supplier.name}`
                                                        : `Activate ${supplier.name}`
                                                }
                                                onClick={() =>
                                                    handleToggle(supplier.id)
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
                    Showing {filteredSuppliers.length} of{" "}
                    {suppliers.length} suppliers
                </p>
            </div>
        </div>
    );
}