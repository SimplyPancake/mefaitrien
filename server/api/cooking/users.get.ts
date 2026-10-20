import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { GroupUsersDto } from "~/types/dto";
import type { SessionEvent } from "~/types";

let handlerFunc = async (event: SessionEvent) => {
  const includeInactive = getQuery(event).includeInactive === "true";
  const roles = event.session.roles.map((role) => role.toUpperCase());
  if (includeInactive && !roles.some((role) => role === "ADMIN" || role === "COOKING")) {
    throw createError({ statusCode: 403, statusMessage: "Not allowed to view inactive users" });
  }

  // Get month roster of this month by all users
  const groupUsers = await prisma.user.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      cookingGroup: true,
    },
  });

  // Group users by cooking group
  const groupedUsers = groupUsers.reduce(
    (groups, user) => {
      const groupName = user.cookingGroup?.name || "Geen groep";
      if (!groups[groupName]) {
        groups[groupName] = {
          id: user.cookingGroup?.id || -1, // Keep id as a number
          name: groupName,
          people: [],
        };
      }
      groups[groupName].people.push({
        id: user.id, // Keep id as a number
        name: user.name,
        isActive: user.isActive,
      });
      return groups;
    },
    {} as Record<
      string,
      { id: number; name: string; people: { id: number; name: string; isActive: boolean }[] }
    >
  );

  // Transform grouped users into an array with unfolded people
  const result: GroupUsersDto[] = Object.values(groupedUsers).map((group) => ({
    id: group.id,
    name: group.name,
    people: group.people,
  }));

  return result;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking/users",
    method: "GET",
    allowType: "AUTHENTICATED",
  });
});
