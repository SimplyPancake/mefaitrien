import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";
import type { WashingFillDto } from "~/types/dto";
import { getWashingPointTotals } from "~/server/utils/washingPoints";

const pageSize = 10;

const handlerFunc = async (event: SessionEvent): Promise<WashingFillDto> => {
  const query = getQuery(event);
  const cursor = query.after === undefined ? null : Number(query.after);
  if (cursor !== null && (!Number.isInteger(cursor) || cursor < 1)) {
    throw createError({ statusCode: 400, statusMessage: "Ongeldige kookdagcursor." });
  }

  const [user, groups] = await Promise.all([
    prisma.user.findUnique({
      where: { id: event.session.id },
      select: { cookingGroupId: true },
    }),
    prisma.cookingGroup.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const requestedGroupId = query.groupId === undefined ? null : Number(query.groupId);
  if (requestedGroupId !== null && (!Number.isInteger(requestedGroupId) || requestedGroupId < 1)) {
    throw createError({ statusCode: 400, statusMessage: "Ongeldige kookgroep." });
  }
  const cookingGroupId = requestedGroupId ?? user?.cookingGroupId ?? groups[0]?.id ?? null;

  if (cookingGroupId === null) {
    return { group: null, groups, members: [], washers: [], days: [], hasMore: false, nextCursor: null };
  }
  if (!groups.some(({ id }) => id === cookingGroupId)) {
    throw createError({ statusCode: 404, statusMessage: "Kookgroep niet gevonden." });
  }

  const today = new Date();
  const dateFilter = {
    OR: [
      { monthRoster: { year: { lt: today.getFullYear() } } },
      {
        monthRoster: {
          year: today.getFullYear(),
          month: { lt: today.getMonth() + 1 },
        },
      },
      {
        monthRoster: {
          year: today.getFullYear(),
          month: today.getMonth() + 1,
        },
        day: { lte: today.getDate() },
      },
    ],
  };
  if (cursor !== null) {
    const cursorDay = await prisma.assignedDay.findFirst({
      where: { id: cursor, cookingGroupId, ...dateFilter },
      select: { id: true },
    });
    if (!cursorDay) {
      throw createError({ statusCode: 400, statusMessage: "Kookdagcursor niet gevonden." });
    }
  }

  const [group, members, washers, assignedDays] = await Promise.all([
    prisma.cookingGroup.findUnique({
      where: { id: cookingGroupId },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { cookingGroupId, isActive: true },
      select: { id: true, name: true, washingpointsBase: true, cookingGroupId: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.assignedDay.findMany({
      where: { cookingGroupId, ...dateFilter },
      select: {
        id: true,
        day: true,
        user: { select: { id: true, name: true } },
        monthRoster: { select: { year: true, month: true } },
        washingRegistration: {
          select: {
            washUserOneId: true,
            washUserTwoId: true,
            washingRegistrationEatUsers: {
              select: { userId: true, amountEat: true },
            },
          },
        },
      },
      orderBy: [
        { monthRoster: { year: "desc" } },
        { monthRoster: { month: "desc" } },
        { day: "desc" },
        { id: "desc" },
      ],
      ...(cursor === null ? {} : { cursor: { id: cursor }, skip: 1 }),
      take: pageSize + 1,
    }),
  ]);

  const pointTotals = await getWashingPointTotals(members);
  const hasMore = assignedDays.length > pageSize;
  const page = assignedDays.slice(0, pageSize);
  return {
    group,
    groups,
    members: members.map((member) => ({
      id: member.id,
      name: member.name,
      washingpoints: pointTotals.get(member.id)!.totalPoints,
    })),
    washers,
    hasMore,
    nextCursor: hasMore ? page.at(-1)!.id : null,
    days: page.map(({ monthRoster, washingRegistration, ...day }) => ({
      ...day,
      year: monthRoster.year,
      month: monthRoster.month,
      cook: day.user,
      registration: washingRegistration
        ? {
            washUserOneId: washingRegistration.washUserOneId,
            washUserTwoId: washingRegistration.washUserTwoId,
            eaters: washingRegistration.washingRegistrationEatUsers,
          }
        : null,
    })),
  };
};

export default defineEventHandler(async (event) =>
  new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/washing/fill",
    method: "GET",
    allowType: "AUTHENTICATED",
  })
);
