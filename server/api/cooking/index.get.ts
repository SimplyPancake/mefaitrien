import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";

let handlerFunc = async (event: H3Event) => {
  // Get month roster of this month by all users
  const roster = await prisma.monthRoster.findFirst({
    where: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
    include: {
      availabilities: true,
    },
  });

  return roster;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handleConfig({
    route: "/api/cooking",
    method: "GET",
    allowType: "AUTHENTICATED",
  });
});
