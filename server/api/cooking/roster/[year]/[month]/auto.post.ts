import prisma from "@@/lib/prisma";
import {
  availabilityValid,
  fillDefaultAvailability,
  MiniAvailability,
} from "~/server/utils/functions";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { SessionEvent } from "~/types";
import { groupAssign } from "~/types/dto";
import { array, number, object, string } from "yup";

let handlerFunc = async (event: SessionEvent) => {
  const params = getRouterParams(event);
  const body = await readBody(event);
  // Validate the params
  const schema = object({
    year: number().required(),
    month: number().required(),
  });

  const bodySchema = object({
    cookingGroups: array().of(number()),
  });

  try {
    await schema.validate(params);
    await bodySchema.validate(body);
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e.message });
  }

  let selectedCookingGroups = bodySchema.cast(body).cookingGroups;

  // get the year and month from the params
  let parsedParams = schema.cast(params);

  // Get month roster of this month by all users
  const roster = await prisma.monthRoster.findFirst({
    where: {
      year: parsedParams.year,
      month: parsedParams.month,
    },
    include: {
      availabilities: true,
      blockedDates: true,
    },
  });

  if (!roster) {
    throw createError({ statusCode: 404, statusMessage: "Roster not found" });
  }

  // Filter out
  const allUsers = await prisma.user.findMany();
  const allGroups = await prisma.cookingGroup.findMany();
  const usersWithAvailability = new Set(roster.availabilities.map((av) => av.userId));
  const defaultAvailabilities = allUsers
    .filter((user) => !usersWithAvailability.has(user.id))
    .flatMap((user) => fillDefaultAvailability(roster, user));

  const allAvailabilities = [...roster.availabilities, ...defaultAvailabilities];
  let cookingGroups: number[] = Array.from(new Set(allUsers.map((x) => x.cookingGroupId))).filter(
    (id): id is number => id !== null
  );

  if (selectedCookingGroups && selectedCookingGroups.length > 0) {
    cookingGroups = cookingGroups.filter((x) => selectedCookingGroups?.includes(x));
  }

  let allAssigns: groupAssign = [];

  // Create map from userId to username
  let nameMap: Map<number, string> = new Map();
  allUsers.forEach((user) => {
    nameMap.set(user.id, user.name);
  });

  // Now we find the best way to divide a month.
  // We go over each date and sort by days with least people available
  cookingGroups.forEach((groupId: number) => {
    if (!allGroups.some((x) => x.id == groupId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Je moet wel om een bestaande groep vragen",
      });
    }

    let assigned: MiniAvailability = [];
    // go over availability days with least available persons
    // at this point all days (nonblocking) should have an availability assigned,
    // since no filled in availability defaults to available
    let users = allUsers.filter((x) => x.cookingGroupId == groupId);
    let availabilities = allAvailabilities.filter((x) => users.some((y) => y.id == x.userId));

    // want to go over days sorted by availability
    let dayNumbers = availabilities.map((x) => x.day);
    let dayNumberAvailabilityScore: Map<number, number> = new Map();
    dayNumbers.forEach((dayNum) => {
      let availableUsers =
        users.length -
        availabilities
          .filter((x) => x.day == dayNum)
          .map((x) => x.availability)
          .filter((x) => x == "UNAVAILABLE").length;

      dayNumberAvailabilityScore.set(dayNum, availableUsers);
    });

    dayNumbers.sort(
      (a, b) => dayNumberAvailabilityScore.get(a)! - dayNumberAvailabilityScore.get(b)!
    );

    // Keep track of how much users cook
    let userCookScore: Map<number, number> = new Map();

    // Set all users' cook score to their original score
    users.forEach((user) => {
      userCookScore.set(user.id, user.cookingpoints);
    });

    // Precompute each user's total available days in this month
    const userAvailableDays = new Map<number, number>();
    users.forEach((user) => {
      const availableDays = availabilities.filter(
        (av) => av.userId === user.id && av.availability !== "UNAVAILABLE"
      ).length;
      userAvailableDays.set(user.id, availableDays);
    });

    dayNumbers.forEach((dayNum) => {
      // Get users available on this day
      const availableUsers = users.filter((user) => {
        const av = availabilities.find((a) => a.userId === user.id && a.day === dayNum);
        return av && av.availability !== "UNAVAILABLE";
      });

      if (availableUsers.length === 0) {
        // No one available, skip or handle as needed
        throw createError({
          status: 500,
          statusMessage: `Niemand kan op dag ${dayNum} koken bij kookgroep id ${groupId}, dus dit automatiseren wordt lastig piemel`,
        });
      }

      // Find the user(s) with the least available days in the month
      let minAvailableDays = Math.min(...availableUsers.map((u) => userAvailableDays.get(u.id)!));
      let rareUsers = availableUsers.filter(
        (u) => userAvailableDays.get(u.id)! === minAvailableDays
      );

      // Of those, pick the one with the lowest cook score
      let minCookScore = Math.min(...rareUsers.map((u) => userCookScore.get(u.id)!));
      let candidates = rareUsers.filter((u) => userCookScore.get(u.id)! === minCookScore);

      // Pick the user with the lowest ID if tie
      let preferredUser = candidates.sort((_a, _b) => Math.random() - 0.5)[0];

      // TODO: Check for preferred dates etc

      assigned.push({
        day: dayNum,
        userId: preferredUser.id,
      });

      userCookScore.set(preferredUser.id, userCookScore.get(preferredUser.id)! + 1);
    });

    let extendedAssigned = assigned.map((x) => ({
      ...x,
      userName: nameMap.get(x.userId)!,
    }));

    allAssigns.push({
      groupId: groupId,
      groupName: allGroups.find((x) => x.id == groupId)!.name,
      availabilities: extendedAssigned,
    });
  });

  return allAssigns;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/roster/*/*/auto", // Doesn't matter what route is
    method: "GET",
    allowType: "AUTHENTICATED",
    role: ["ADMIN", "COOKING"],
  });
});
