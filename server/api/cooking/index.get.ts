import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";
import { number, object } from "yup";

let handlerFunc = async (event: H3Event) => {
  const querySchema = object({
    year: number().integer().min(1).optional(),
    month: number().integer().min(1).max(12).optional(),
  });
  let query;
  try {
    query = await querySchema.validate(getQuery(event));
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Invalid roster month";
    throw createError({ statusCode: 400, statusMessage: message });
  }

  const now = new Date();
  const roster = await prisma.monthRoster.findFirst({
    where: {
      year: query.year ?? now.getFullYear(),
      month: query.month ?? now.getMonth() + 1,
    },
    include: {
      availabilities: true,
      assignedDays: {
        include: {
          user: { select: { id: true, name: true } },
          cookingGroup: { select: { id: true, name: true } },
        },
      },
    },
  });

  return roster ?? null;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking",
    method: "GET",
    allowType: "AUTHENTICATED",
  });
});
