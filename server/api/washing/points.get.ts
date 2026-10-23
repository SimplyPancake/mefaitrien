import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { getWashingPointTotals } from "~/server/utils/washingPoints";
import { AllowType } from "~/types";
import type { WashingPointsOverviewDto } from "~/types/dto";

const handlerFunc = async (): Promise<WashingPointsOverviewDto> => {
  const [users, cookingGroups, amountRegistrations] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        washingpointsBase: true,
        cookingGroupId: true,
        isActive: true,
        cookingGroup: { select: { name: true } },
        washingPenalties: {
          select: { id: true, amount: true, reason: true },
          orderBy: { id: "desc" },
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.cookingGroup.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.washingRegistration.count(),
  ]);
  const pointTotals = await getWashingPointTotals(users);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      washingpoints: pointTotals.get(user.id)!.totalPoints,
      basePoints: pointTotals.get(user.id)!.basePoints,
      computedPoints: pointTotals.get(user.id)!.computedPoints,
      penaltyPoints: pointTotals.get(user.id)!.penaltyPoints,
      penalties: user.washingPenalties,
      cookingGroupId: user.cookingGroupId,
      cookingGroupName: user.cookingGroup?.name ?? null,
      isActive: user.isActive,
    })),
    cookingGroups,
    registrations: amountRegistrations,
  };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/washing/points",
    method: "GET",
    allowType: AllowType.AUTHENTICATED,
  });
});
