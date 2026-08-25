"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { StaffsTable, Staff } from "@/components/tables/staffs-table";
import { WelcomeCard } from "@/components/cards/welcome-card";

export interface RoleStaffPageProps {
  title: string;
  subtitle: string;
  roleName: string;
  roleValue: string;
  staffList: Staff[];
  registerHref: string;
}

export function RoleStaffPage({
  title,
  subtitle,
  roleName,
  roleValue,
  staffList,
  registerHref,
}: RoleStaffPageProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredStaff = useMemo(() => {
    if (statusFilter === "all") return staffList;
    return staffList.filter((s) => s.status === statusFilter);
  }, [staffList, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / 10));

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <WelcomeCard
        userName="HR Manager"
        roleName={title}
        subtitle={subtitle}
        onQuickAction={() => router.push(registerHref)}
        actionText={`Register New ${roleName}`}
      />

      <StaffsTable
        staffs={filteredStaff}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        currentPage={currentPage}
        totalPages={totalPages}
        totalStaff={filteredStaff.length}
        onPageChange={setCurrentPage}
        userRole="HR"
      />
    </div>
  );
}
