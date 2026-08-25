import type { AppRole } from "@/lib/auth/roles";

export type Roles = AppRole;

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
    };
  }
}

export {};
