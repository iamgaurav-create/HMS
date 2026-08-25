import type { AppRole } from "@/lib/auth/roles";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { RouteAccessRule } from "@/lib/routes";

type RoleAccessPreviewProps = {
  rules: RouteAccessRule[];
  currentRole?: AppRole;
};

export function RoleAccessPreview({ rules, currentRole }: RoleAccessPreviewProps) {
  return (
    <div className="space-y-3">
      {rules.map((rule, index) => {
        const routeName = rule.matcher.name || `Route ${index + 1}`;
        return (
          <div key={index} className="rounded-lg border p-3">
            <h4 className="text-sm font-medium mb-2">{routeName}</h4>
            <div className="flex flex-wrap gap-2">
              {rule.allowedRoles.map((role) => (
                <span
                  key={role}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    currentRole === role
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ROLE_LABELS[role]}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}