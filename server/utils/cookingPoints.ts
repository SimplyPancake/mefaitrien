import prisma from "@@/lib/prisma";

type UserCookingPointsBase = {
  id: number;
  cookingpointsBase: number;
};

export type CookingPointTotals = {
  basePoints: number;
  computedPoints: number;
  totalPoints: number;
};

export const getCookingPointTotals = async (
  users: readonly UserCookingPointsBase[]
): Promise<Map<number, CookingPointTotals>> => {
  if (users.length === 0) {
    return new Map();
  }

  const assignmentCounts = await prisma.assignedDay.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map(({ id }) => id) } },
    _count: { _all: true },
  });
  const computedPointsByUser = new Map(
    assignmentCounts.map(({ userId, _count }) => [userId, _count._all])
  );

  return new Map(
    users.map(({ id, cookingpointsBase }) => {
      const computedPoints = computedPointsByUser.get(id) ?? 0;
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
