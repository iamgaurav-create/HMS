import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

import { SuppliersView } from "./components/suppliers-view";
import type { Supplier } from "./components/suppliers-table";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

export default async function SuppliersPage() {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    if (!userId) {
        redirectToSignIn({ returnBackUrl: "/pharmacy/suppliers" });
    }

    const userRole = getRoleFromSessionClaims(sessionClaims);

    if (!userRole) {
        redirect("/unauthorized?reason=missing_role");
    }

    if (!ALLOWED_ROLES.includes(userRole)) {
        redirect("/unauthorized");
    }

    const suppliers = await db.supplier.findMany({
        orderBy: { created_at: "desc" },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            is_active: true,
            created_at: true,
        },
    });

    const initialSuppliers: Supplier[] = suppliers.map((supplier) => ({
        ...supplier,
        created_at: supplier.created_at.toISOString(),
    }));

    return (
        <AppShell userRole={userRole}>
            <SuppliersView initialSuppliers={initialSuppliers} />
        </AppShell>
    );
}