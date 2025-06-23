import type { AvailabilityType, Role } from "@prisma/client";

export const roleTranslations: Record<Role, string> = {
  ADMIN: "Beheerder",
  USER: "Gebruiker",
  COOKING: "Kookbeheer",
};

export const availabilityTranslations: Record<AvailabilityType, string> = {
  AVAILABLE: "Beschikbaar",
  UNAVAILABLE: "Onbeschikbaar",
  NEGATIVE: "Liever niet",
  POSITIVE: "Graag",
};
