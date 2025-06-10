import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { GroupUsersDto } from "~/types/dto";
import { H3Event } from "h3";

let handlerFunc = async (event: H3Event) => {
  // Get month roster of this month by all users
  const groupUsers = await prisma.user.findMany({
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
          id: user.cookingGroup?.id || 0, // Keep id as a number
          name: groupName,
          people: [],
        };
      }
      groups[groupName].people.push({
        id: user.id, // Keep id as a number
        name: user.name,
      });
      return groups;
    },
    {} as Record<string, { id: number; name: string; people: { id: number; name: string }[] }>
  );

  // Transform grouped users into an array with unfolded people
  const result: GroupUsersDto[] = Object.values(groupedUsers).map((group) => ({
    id: group.id,
    name: group.name,
    people: group.people.map((person) => ({
      id: person.id,
      name: person.name,
    })),
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
