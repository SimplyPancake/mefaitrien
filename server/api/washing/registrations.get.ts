import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { AllowType } from "~/types";
import { Role } from "~/generated/prisma/enums";
import type { WashingRegistrationAdminDto } from "~/types/dto";

const handlerFunc = async (): Promise<WashingRegistrationAdminDto[]> => {
  const registrations = await prisma.washingRegistration.findMany({
    select: {
      id: true,
      cookingGroup: { select: { name: true } },
      assignedDay: {
        select: {
          day: true,
          monthRoster: { select: { month: true, year: true } },
          user: { select: { name: true } },
        },
      },
      washUserOne: { select: { name: true } },
      washUserTwo: { select: { name: true } },
      washingRegistrationEatUsers: {
        select: { amountEat: true, user: { select: { name: true } } },
      },
    },
    orderBy: [
      { assignedDay: { monthRoster: { year: "desc" } } },
      { assignedDay: { monthRoster: { month: "desc" } } },
      { assignedDay: { day: "desc" } },
      { id: "desc" },
    ],
  });

  return registrations.map(({ assignedDay, cookingGroup, washUserOne, washUserTwo, washingRegistrationEatUsers, ...registration }) => ({
    ...registration,
    day: assignedDay.day,
    month: assignedDay.monthRoster.month,
    year: assignedDay.monthRoster.year,
    cookingGroupName: cookingGroup.name,
    cookName: assignedDay.user.name,
    washUserOneName: washUserOne.name,
    washUserTwoName: washUserTwo.name,
    eaters: washingRegistrationEatUsers.map(({ user, amountEat }) => ({
      name: user.name,
      amountEat,
    })),
  }));
};

export default defineEventHandler(async (event) =>
  new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/washing/registrations",
    method: "GET",
    allowType: AllowType.ROLE,
    role: [Role.ADMIN],
  })
);
