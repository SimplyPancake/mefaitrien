import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { AdminUserDTO, AdminUsersDTO } from "~/types/dto";
import { H3Event } from "h3";

import prisma from "../../../lib/prisma";

let handlerFunc = async (event: H3Event) => {
  // Return the users
  const users = await prisma.user.findMany({
    include: {
      cookingGroup: true,
    },
  });

  const cookingGroups = await prisma.cookingGroup.findMany();

  const userDTOs: AdminUserDTO[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    cookingGroup: user.cookingGroup
      ? {
          id: user.cookingGroup.id,
          name: user.cookingGroup.name,
        }
      : undefined,
  }));

  const toReturn: AdminUsersDTO = {
    users: userDTOs,
    cookingGroups: cookingGroups,
  };

  return toReturn;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle();
});
