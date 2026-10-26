import { AvailabilityType } from "~/generated/prisma/enums";
import prisma from "~/lib/prisma";

const getDateRange = (
  userId: number,
  date: Date
) => {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new RangeError("A valid user ID is required.");
  }
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("A valid date is required.");
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayStart = new Date(Date.UTC(year, month - 1, day));
  const nextDay = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  return { year, month, day, dayStart, nextDay };
};

export const isUserAbsentOnDate = async (
  userId: number,
  date: Date
): Promise<boolean> => {
  const { dayStart, nextDay } = getDateRange(userId, date);
  const absence = await prisma.absence.findFirst({
    where: {
      userId,
      start: { lt: nextDay },
      OR: [{ end: null }, { end: { gte: dayStart } }],
    },
    select: { id: true },
  });

  return absence !== null;
};

export const isUserAvailableOnDate = async (
  userId: number,
  date: Date
): Promise<boolean> => {
  const { year, month, day, dayStart, nextDay } = getDateRange(userId, date);
  const availableUser = await prisma.user.findFirst({
    where: {
      id: userId,
      absences: {
        none: {
          start: { lt: nextDay },
          OR: [{ end: null }, { end: { gte: dayStart } }],
        },
      },
      Availability: {
        none: {
          day,
          availability: AvailabilityType.UNAVAILABLE,
          monthRoster: { is: { year, month } },
        },
      },
    },
    select: { id: true },
  });

  return availableUser !== null;
};
