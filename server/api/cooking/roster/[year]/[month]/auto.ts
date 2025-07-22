import prisma from "@@/lib/prisma";
import { ExtendedMonthRoster, fillDefaultAvailability } from "~/server/utils/functions";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { SessionEvent } from "~/types";
import { number, object, string } from "yup";

let handlerFunc = async (event: SessionEvent) => {
  const params = getRouterParams(event);
  // Validate the params
  const schema = object({
    year: number().required(),
    month: number().required(),
  });

  try {
    await schema.validate(params);
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e.message });
  }

  // get the year and month from the params
  let parsedParams = schema.cast(params);

  // Get month roster of this month by all users
  const roster = await prisma.monthRoster.findFirst({
    where: {
      year: parsedParams.year,
      month: parsedParams.month,
    },
    include: {
      availabilities: true,
      blockedDates: true,
    },
  });

  if (!roster) {
    throw createError({ statusCode: 404, statusMessage: "Roster not found" });
  }

  // Filter out
  const allUsers = await prisma.user.findMany();
  const usersWithAvailability = new Set(roster.availabilities.map((av) => av.userId));
  const defaultAvailabilities = allUsers
    .filter((user) => !usersWithAvailability.has(user.id))
    .flatMap((user) => fillDefaultAvailability(roster, user));

  const allAvailabilities = [...roster.availabilities, ...defaultAvailabilities];

  // Now we find the best way to divide a month.
  // Begin bij de grootste constraints, ga daarna verder

  // DFS uses a search depth of 12, the rest is does greedily
  //
  let bestAssigment: any = {};
  let bestScore: number = Number.MIN_SAFE_INTEGER;

  const dfs = () => {};
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/roster/*/*/auto", // Doesn't matter what route is
    method: "GET",
    allowType: "AUTHENTICATED",
    role: ["ADMIN", "COOKING"],
  });
});
