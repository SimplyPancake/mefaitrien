import { AvailabilityType, BlockedDay, MonthRoster, User } from "@prisma/client";

export type MiniAvailability = Array<{
  userId: number;
  day: number;
}>;

export type ExtendedMonthRoster = MonthRoster & {
  blockedDates: BlockedDay[];
};

export const fillDefaultAvailability = (monthRoster: ExtendedMonthRoster, user: User) => {
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

export const calculateVariance = (numbers: number[]): number => {
  const n = numbers.length;
  if (n === 0) return 0;

  const mean = numbers.reduce((sum, val) => sum + val, 0) / n;
  const squaredDiffs = numbers.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / n;

  return variance;
};

export const scoreAvailability = (
  availabilities: MiniAvailability,
  roster: ExtendedMonthRoster
): number => {
  // Check all days for uniqueness
  if ([...new Set(availabilities.map((x) => x.day))].length != availabilities.length) {
    return -1;
  }

  let daysInMonth = new Date(roster.year, roster.month, 0).getDate();
  let daysToCook = daysInMonth - roster.blockedDates.length;

  // If not all days have been filled, return -1
  if (daysToCook != availabilities.length) {
    return -1;
  }

  // If any week has >1 cook per housemate, +50 penalty per housemate
  // TODO: Cache the weeks of the month because they do not need to be recomputed each evaluation
  let weeks = getFullWeeksStartAndEndInMonth(roster.month, roster.year);

  // calculate variance by importing function from functions.ts
  // preference bonus = #rather would like to cook used
  // Also preference penalty for #rather nots
  // return 1000 - penalty - variance + (10 * preferenceBonus)]
  let score = 1;
  return Math.max(0, score);
};

function getFullWeeksStartAndEndInMonth(month: number, year: number) {
  let weeks = [],
    firstDate = new Date(year, month, 1),
    lastDate = new Date(year, month + 1, 0),
    numDays = lastDate.getDate();

  let start = 1;
  let end;
  if (firstDate.getDay() === 1) {
    end = 7;
  } else if (firstDate.getDay() === 0) {
    let preMonthEndDay = new Date(year, month, 0);
    start = preMonthEndDay.getDate() - 6 + 1;
    end = 1;
  } else {
    let preMonthEndDay = new Date(year, month, 0);
    start = preMonthEndDay.getDate() + 1 - firstDate.getDay() + 1;
    end = 7 - firstDate.getDay() + 1;
    weeks.push({
      start: start,
      end: end,
    });
    start = end + 1;
    end = end + 7;
  }
  while (start <= numDays) {
    weeks.push({
      start: start,
      end: end,
    });
    start = end + 1;
    end = end + 7;
    end = start === 1 && end === 8 ? 1 : end;
    if (end > numDays && start <= numDays) {
      end = end - numDays;
      weeks.push({
        start: start,
        end: end,
      });
      break;
    }
  }
  // *** the magic starts here
  return weeks.map(({ start, end }, index) => {
    const sub = +(start > end && index === 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(year, month - sub, start + index);
      return {
        date: date.getDate(),
        month: date.getMonth(),
      };
    });
  });
}
