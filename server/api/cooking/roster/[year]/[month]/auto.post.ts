import prisma from "@@/lib/prisma";
import { AvailabilityType } from "~/generated/prisma/browser";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { AllowType, type SessionEvent } from "~/types";
import type { groupAssign } from "~/types/dto";
import { array, number, object, string } from "yup";

let handlerFunc = async (event: SessionEvent) => {
  const params = getRouterParams(event);
  const body = await readBody(event);
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

  const selectedCookingGroups = bodySchema.cast(body).cookingGroups;
  const parsedParams = schema.cast(params);
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

  const allUsers = await prisma.user.findMany();
  const allGroups = await prisma.cookingGroup.findMany();
  let cookingGroups = Array.from(new Set(allUsers.map((user) => user.cookingGroupId))).filter(
    (id): id is number => id !== null
  );

  if (selectedCookingGroups && selectedCookingGroups.length > 0) {
    cookingGroups = Array.from(new Set(selectedCookingGroups)).filter(
      (id): id is number => id !== undefined
    );
    if (cookingGroups.some((id) => !allGroups.some((group) => group.id === id))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Je moet wel om een bestaande groep vragen",
      });
    }
  }

  const nameMap = new Map(allUsers.map((user) => [user.id, user.name]));
  const blockedDays = new Set(roster.blockedDates.map((blockedDate) => blockedDate.day));
  const daysInMonth = new Date(roster.year, roster.month, 0).getDate();
  const daysToAssign = Array.from({ length: daysInMonth }, (_, index) => index + 1).filter(
    (day) => !blockedDays.has(day)
  );
  const availabilityByUserDay = new Map<number, Map<number, AvailabilityType>>();
  roster.availabilities.forEach((availability) => {
    let userAvailability = availabilityByUserDay.get(availability.userId);
    if (!userAvailability) {
      userAvailability = new Map();
      availabilityByUserDay.set(availability.userId, userAvailability);
    }
    userAvailability.set(availability.day, availability.availability);
  });

  const allAssigns: groupAssign = [];
  for (const groupId of cookingGroups) {
    const users = allUsers.filter((user) => user.cookingGroupId === groupId);
    const userCookScore = new Map(users.map((user) => [user.id, user.cookingpoints]));
    const weekOffset = (new Date(roster.year, roster.month - 1, 1).getDay() + 6) % 7;
    const daysByWeek = new Map<number, number[]>();

    daysToAssign.forEach((day) => {
      const week = Math.floor((day - 1 + weekOffset) / 7);
      const weekDays = daysByWeek.get(week) ?? [];
      weekDays.push(day);
      daysByWeek.set(week, weekDays);
    });

    const getAvailability = (userId: number, day: number): AvailabilityType =>
      availabilityByUserDay.get(userId)?.get(day) ?? AvailabilityType.AVAILABLE;
    const getAvailableUsers = (day: number) =>
      users.filter((user) => getAvailability(user.id, day) !== AvailabilityType.UNAVAILABLE);
    const preferenceAdjustment = (availability: AvailabilityType) => {
      switch (availability) {
        case AvailabilityType.POSITIVE:
          return -2;
        case AvailabilityType.NEGATIVE:
          return 3;
        default:
          return 0;
      }
    };
    const getCandidateCost = (userId: number, day: number) =>
      (userCookScore.get(userId) ?? 0) +
      preferenceAdjustment(getAvailability(userId, day));
    const assigned: Array<{ day: number; userId: number }> = [];

    for (const weekDays of daysByWeek.values()) {
      const availableUsersByDay = new Map<number, typeof users>();
      weekDays.forEach((day) => {
        const availableUsers = getAvailableUsers(day);
        if (availableUsers.length === 0) {
          throw createError({
            statusCode: 409,
            statusMessage: `Niemand is beschikbaar op dag ${day} in kookgroep ${groupId}.`,
          });
        }
        availableUsersByDay.set(day, availableUsers);
      });

      // Match distinct cooks first, maximizing how many dates avoid a weekly repeat.
      const userToDay = new Map<number, number>();
      const orderedDays = [...weekDays].sort(
        (a, b) =>
          availableUsersByDay.get(a)!.length - availableUsersByDay.get(b)!.length || a - b
      );
      const matchDay = (day: number, seenUsers: Set<number>): boolean => {
        const candidates = [...availableUsersByDay.get(day)!].sort(
          (a, b) =>
            getCandidateCost(a.id, day) - getCandidateCost(b.id, day) || a.id - b.id
        );

        for (const user of candidates) {
          if (seenUsers.has(user.id)) {
            continue;
          }
          seenUsers.add(user.id);
          const previousDay = userToDay.get(user.id);
          if (previousDay === undefined || matchDay(previousDay, seenUsers)) {
            userToDay.set(user.id, day);
            return true;
          }
        }
        return false;
      };

      orderedDays.forEach((day) => matchDay(day, new Set()));

      const dayToUser = new Map<number, number>();
      userToDay.forEach((day, userId) => dayToUser.set(day, userId));

      // Update the running score for each cook already assigned once this week.
      dayToUser.forEach((userId) => {
        userCookScore.set(userId, (userCookScore.get(userId) ?? 0) + 1);
      });

      // If a week has more dates than distinct available cooks, assign the remainder
      // to the lowest-scoring available person, still respecting preferences.
      const unmatchedDays = weekDays
        .filter((day) => !dayToUser.has(day))
        .sort(
          (a, b) =>
            availableUsersByDay.get(a)!.length - availableUsersByDay.get(b)!.length || a - b
        );
      unmatchedDays.forEach((day) => {
        const selectedUser = [...availableUsersByDay.get(day)!].sort(
          (a, b) =>
            getCandidateCost(a.id, day) - getCandidateCost(b.id, day) || a.id - b.id
        )[0];
        if (!selectedUser) {
          throw createError({
            statusCode: 409,
            statusMessage: `Niemand is beschikbaar op dag ${day} in kookgroep ${groupId}.`,
          });
        }
        dayToUser.set(day, selectedUser.id);
        userCookScore.set(
          selectedUser.id,
          (userCookScore.get(selectedUser.id) ?? 0) + 1
        );
      });

      weekDays.forEach((day) => {
        const userId = dayToUser.get(day);
        if (userId === undefined) {
          throw createError({
            statusCode: 500,
            statusMessage: `Automatische indeling is mislukt voor dag ${day}.`,
          });
        }
        assigned.push({ day, userId });
      });
    }

    allAssigns.push({
      groupId,
      groupName: allGroups.find((group) => group.id === groupId)!.name,
      availabilities: assigned
        .sort((a, b) => a.day - b.day)
        .map((assignment) => ({
          ...assignment,
          userName: nameMap.get(assignment.userId)!,
        })),
    });
  }

  return allAssigns;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/roster/*/*/auto", // Doesn't matter what route is
    method: "GET",
    allowType: AllowType.ROLE,
    role: ["ADMIN", "COOKING"],
  });
});
