import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";

import prisma from "../../../lib/prisma";

let handlerFunc = async (event: H3Event) => {
  // Return the users
  const users = await prisma.user.findMany({
    include: {
      cookingGroup: true,
    },
  });

  return users;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle();
});
