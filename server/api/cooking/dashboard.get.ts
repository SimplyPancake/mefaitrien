import prisma from "@@/lib/prisma";
import { AllowType, type SessionEvent } from "~/types";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { getCookingPointTotals } from "~/server/utils/cookingPoints";
import { getWashingPointTotals } from "~/server/utils/washingPoints";
import type { HomeDashboardDto } from "~/types/dto";

const handlerFunc = async (event: SessionEvent): Promise<HomeDashboardDto> => {
  const today = new Date();
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const daysByMonth = new Map<string, { year: number; month: number; days: Set<number> }>();
  weekDays.forEach((date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;
    const entry = daysByMonth.get(key) ?? { year, month, days: new Set<number>() };
    entry.days.add(date.getDate());
    daysByMonth.set(key, entry);
  });

  const [rosters, user] = await Promise.all([
    prisma.monthRoster.findMany({
      where: {
        OR: [...daysByMonth.values()].map(({ year, month }) => ({
          year,
          month,
        })),
      },
      select: {
        year: true,
        month: true,
        assignedDays: {
          include: {
            user: { select: { id: true, name: true } },
            cookingGroup: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: event.session.id },
      select: {
        id: true,
        cookingpointsBase: true,
        washingpointsBase: true,
        cookingGroupId: true,
      },
    }),
  ]);

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Gebruiker niet gevonden." });
  }

  const [cookingPointTotals, washingPointTotals] = await Promise.all([
    getCookingPointTotals([user]),
    getWashingPointTotals([user]),
  ]);
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
  const todayAssignments =
    rosters
      .find((roster) => `${roster.year}-${roster.month}` === todayKey)
      ?.assignedDays.filter((assignment) => assignment.day === today.getDate()) ?? [];

  const cookingDaysThisWeek = rosters.flatMap((roster) => {
    const month = daysByMonth.get(`${roster.year}-${roster.month}`);
    if (!month) return [];

    return roster.assignedDays
      .filter((assignment) => assignment.userId === user.id && month.days.has(assignment.day))
      .map((assignment) => {
        const monthPart = String(roster.month).padStart(2, "0");
        const dayPart = String(assignment.day).padStart(2, "0");
        return `${roster.year}-${monthPart}-${dayPart}`;
      });
  }).sort();

  return {
    todayAssignments,
    cookingPoints: cookingPointTotals.get(user.id)!.totalPoints,
    washingPoints: washingPointTotals.get(user.id)!.totalPoints,
    cookingDaysThisWeek,
  };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking/dashboard",
    method: "GET",
    allowType: AllowType.AUTHENTICATED,
  });
});
