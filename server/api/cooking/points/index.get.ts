import prisma from "@@/lib/prisma";
import { AllowType } from "~/types";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { CookingPointsOverviewDto } from "~/types/dto";

const handlerFunc = async (): Promise<CookingPointsOverviewDto> => {
  const [users, cookingGroups] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        cookingpoints: true,
        cookingGroupId: true,
        isActive: true,
        cookingGroup: {
          select: { name: true },
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.cookingGroup.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      cookingpoints: user.cookingpoints,
      cookingGroupId: user.cookingGroupId,
      cookingGroupName: user.cookingGroup?.name ?? null,
      isActive: user.isActive,
    })),
    cookingGroups,
  };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking/points",
    method: "GET",
    allowType: AllowType.AUTHENTICATED,
  });
});
