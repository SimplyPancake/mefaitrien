import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { SessionEvent } from "~/types";
import { number, object, string } from "yup";

let handlerFunc = async (event: SessionEvent) => {
  const params = await getRouterParams(event);
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

  return roster;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/roster/*/*", // Doesn't matter what route is
    method: "GET",
    allowType: "AUTHENTICATED",
  });
});
