import type { AuthenticatedUser } from "@/types/api";
import type { LoginResponse, UserProfileResponse } from "@/features/auth/types";

const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  USER: [
    "profile:read",
    "profile:write",
    "spaces:read",
    "spaces:write",
    "assets:read",
    "assets:write",
    "search:read",
    "dashboard:read",
    "sharing:read",
    "sharing:write",
    "settings:read",
    "settings:write",
  ],
  ADMIN: [
    "profile:read",
    "profile:write",
    "spaces:read",
    "spaces:write",
    "assets:read",
    "assets:write",
    "search:read",
    "dashboard:read",
    "sharing:read",
    "sharing:write",
    "users:read",
    "users:write",
    "settings:read",
    "settings:write",
    "admin:access",
  ],
};

export function resolvePermissions(roles: string[]): string[] {
  const permissions = new Set<string>();

  for (const role of roles) {
    const mapped = ROLE_PERMISSIONS[role.toUpperCase()];
    mapped?.forEach((permission) => permissions.add(permission));
  }

  return Array.from(permissions);
}

export function mapLoginUser(user: LoginResponse["user"]): AuthenticatedUser {
  const roles = user.roles ?? [];
  return {
    ...user,
    roles,
    permissions: user.permissions ?? resolvePermissions(roles),
  };
}

export function mapProfileUser(profile: UserProfileResponse): AuthenticatedUser {
  const roles = profile.roles ?? [];
  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    profileImageUrl: profile.profileImageUrl,
    roles,
    permissions: resolvePermissions(roles),
  };
}

export function hasRole(user: AuthenticatedUser | null, role: string): boolean {
  if (!user?.roles?.length) {
    return false;
  }

  return user.roles.some(
    (userRole) => userRole.toUpperCase() === role.toUpperCase(),
  );
}

export function hasPermission(
  user: AuthenticatedUser | null,
  permission: string,
): boolean {
  if (!user?.permissions?.length) {
    return false;
  }

  return user.permissions.includes(permission);
}

export function hasAnyRole(
  user: AuthenticatedUser | null,
  roles: string[],
): boolean {
  return roles.some((role) => hasRole(user, role));
}

export function hasAnyPermission(
  user: AuthenticatedUser | null,
  permissions: string[],
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function canAccess(
  user: AuthenticatedUser | null,
  options: {
    roles?: string[];
    permissions?: string[];
    requireAll?: boolean;
  },
): boolean {
  const { roles = [], permissions = [], requireAll = false } = options;

  if (!user) {
    return false;
  }

  const roleCheck =
    roles.length === 0 ||
    (requireAll
      ? roles.every((role) => hasRole(user, role))
      : hasAnyRole(user, roles));

  const permissionCheck =
    permissions.length === 0 ||
    (requireAll
      ? permissions.every((permission) => hasPermission(user, permission))
      : hasAnyPermission(user, permissions));

  return roleCheck && permissionCheck;
}
