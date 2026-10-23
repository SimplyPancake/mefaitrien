import prisma from "@@/lib/prisma";
import { getWashingPointTotals } from "~/server/utils/washingPoints";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { AllowType } from "~/types";
import type { WashingPointsOverviewDto } from "~/types/dto";

const handlerFunc = async (): Promise<WashingPointsOverviewDto> => {
  const [users, cookingGroups] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        washingpointsBase: true,
        cookingGroupId: true,
        isActive: true,
        cookingGroup: { select: { name: true } },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.cookingGroup.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const pointTotals = await getWashingPointTotals(users);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      washingpoints: pointTotals.get(user.id)!.totalPoints,
      cookingGroupId: user.cookingGroupId,
      cookingGroupName: user.cookingGroup?.name ?? null,
      isActive: user.isActive,
    })),
    cookingGroups,
  };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/washing/points",
    method: "GET",
    allowType: AllowType.AUTHENTICATED,
  });
});
