import prisma from "@@/lib/prisma";
import { getCookingPointTotals } from "~/server/utils/cookingPoints";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { AllowType } from "~/types";
import type { CookingPointsManagementDto } from "~/types/dto";

const handlerFunc = async (): Promise<CookingPointsManagementDto> => {
  const [users, cookingGroups] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        cookingpointsBase: true,
        cookingGroupId: true,
        isActive: true,
        cookingGroup: { select: { name: true } },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.cookingGroup.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const pointTotals = await getCookingPointTotals(users);

  return {
    users: users.map((user) => {
      const totals = pointTotals.get(user.id)!;
      return {
        id: user.id,
        name: user.name,
        cookingpoints: totals.totalPoints,
        basePoints: totals.basePoints,
        computedPoints: totals.computedPoints,
        cookingGroupId: user.cookingGroupId,
        cookingGroupName: user.cookingGroup?.name ?? null,
        isActive: user.isActive,
      };
    }),
    cookingGroups,
  };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking/points/manage",
    method: "GET",
    allowType: AllowType.ROLE,
    role: ["COOKING"],
  });
});
