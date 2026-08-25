import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <Skeleton className="h-36 w-full rounded-2xl" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

export function RoleDashboardSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}

export function AdminSkeleton() {
  return <DashboardSkeleton />;
}

export function DoctorSkeleton() {
  return <RoleDashboardSkeleton />;
}

export function PatientSkeleton() {
  return <RoleDashboardSkeleton />;
}

export function ReceptionistSkeleton() {
  return <RoleDashboardSkeleton />;
}

export function NurseSkeleton() {
  return <RoleDashboardSkeleton />;
}

export function LabSkeleton() {
  return <RoleDashboardSkeleton />;
}

export function PharmacySkeleton() {
  return <RoleDashboardSkeleton />;
}

export function AccountSkeleton() {
  return <RoleDashboardSkeleton />;
}

export function HRSkeleton() {
  return <RoleDashboardSkeleton />;
}
