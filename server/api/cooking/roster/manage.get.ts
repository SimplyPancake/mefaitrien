// Post availability
import prisma from "@@/lib/prisma";
import { AvailabilityType, Role } from "@prisma/client";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { type ManageMonthDto } from "~/types/dto";
import { H3Event } from "h3";
import type { BlockedDay, MonthRoster, User } from "@prisma/client";

type ExtendedMonthRoster = MonthRoster & {
  blockedDates: BlockedDay[];
};

const fillDefaultAvailability = (monthRoster: ExtendedMonthRoster, user: User) => {
  const blockedDays = new Set(monthRoster.blockedDates.map((day) => day.day));
  const amountOfDays = new Date(monthRoster.year, monthRoster.month, 0).getDate();
  const allDays = Array.from({ length: amountOfDays }, (_, i) => i + 1);
  const unblocked = allDays.filter((day) => !blockedDays.has(day));

  return unblocked.map((day) => ({
    id: -1, // Placeholder ID for default availability
    day,
    availability: "AVAILABLE" as AvailabilityType,
    userId: user.id,
    monthRosterId: monthRoster.id,
    user: user,
    createdAt: new Date(),
    modifiedAt: new Date(),
  }));
};

// Returns the months and year that rosters have been made.
let handlerFunc = async (event: H3Event) => {
  const data = await prisma.monthRoster.findMany({
    where: {
      year: {
        gte: new Date().getFullYear() - 2, // Limit to 2 years previous
      },
    },
    include: {
      availabilities: {
        include: {
          user: true,
        },
      },
      blockedDates: true,
    },
  });

  const allUsers = await prisma.user.findMany();
  const totalUsers = await prisma.user.count();
  const fullData = data ?? [];
  const dto: ManageMonthDto[] = fullData.map((d) => {
    // For each user who hasn't filled in availability, create default AVAILABLE entries
    const usersWithAvailability = new Set(d.availabilities.map((av) => av.userId));
    const defaultAvailabilities = allUsers
      .filter((user) => !usersWithAvailability.has(user.id))
      .flatMap((user) => fillDefaultAvailability(d, user));

    // Combine existing and default availabilities
    const allAvailabilities = [...d.availabilities, ...defaultAvailabilities];

    const availCount = allAvailabilities.filter((x) => x.availability != "UNAVAILABLE").length;
    const totalAvailCount = allAvailabilities.length;
    const monthAssignedYet = d.status == "ASSIGNED";
    const totalFilledIn = Array.from(new Set(allAvailabilities.map((aval) => aval.userId))).length;

    const percentage = Math.round((availCount / totalAvailCount) * 100);
    return {
      ...d,
      availabilities: allAvailabilities,
      averageAvailability: percentage,
      daysWithoutCook: monthAssignedYet ? -1 : undefined,
      filledIn: totalFilledIn,
      maxAssigned: totalUsers,
    };
  });

  return dto;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking/roster/months",
    method: "GET",
    allowType: "AUTHENTICATED",
    role: ["ADMIN", "COOKING"],
  });
});
