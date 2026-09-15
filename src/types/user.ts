/**
 * Canonical application role — the single source of truth for FleetTrack roles.
 * The product has exactly two roles: ADMIN and CLIENT (CLIENT is the synthetic
 * runtime role of a Client login). Every other module imports this type.
 */
export type UserRole = "ADMIN" | "CLIENT";
