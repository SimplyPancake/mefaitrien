import prisma from "@@/lib/prisma";
import { REDIS_COOKINGPOINTS } from "../consts/redisKeys";

type UserCookingPointsBase = {
  id: number;
  cookingpointsBase: number;
};

export type CookingPointTotals = {
  basePoints: number;
  computedPoints: number;
  totalPoints: number;
};

// userId -> number of assigned days
type ComputedCookingPoints = Record<number, number>;

const refreshCookingPoints = async (): Promise<ComputedCookingPoints> => {
  const assignmentCounts = await prisma.assignedDay.groupBy({
    by: ["userId"],
    _count: { _all: true },
  });
  const computed: ComputedCookingPoints = Object.fromEntries(
    assignmentCounts.map(({ userId, _count }) => [userId, _count._all])
  );
  await useStorage("redis").setItem(REDIS_COOKINGPOINTS, computed);
  return computed;
};

// Call after any assignedDay change
export const invalidateCookingPoints = async () => {
  await useStorage("redis").removeItem(REDIS_COOKINGPOINTS);
  await refreshCookingPoints();
};

export const getCookingPointTotals = async (
  users: readonly UserCookingPointsBase[]
): Promise<Map<number, CookingPointTotals>> => {
  if (users.length === 0) {
    return new Map();
  }

  const computedPointsByUser =
    (await useStorage("redis").getItem<ComputedCookingPoints>(REDIS_COOKINGPOINTS)) ??
    (await refreshCookingPoints());

  return new Map(
    users.map(({ id, cookingpointsBase }) => {
      const computedPoints = computedPointsByUser[id] ?? 0;
      return [
        id,
        {
          basePoints: cookingpointsBase,
          computedPoints,
          totalPoints: cookingpointsBase + computedPoints,
        },
      ];
    })
  );
};
