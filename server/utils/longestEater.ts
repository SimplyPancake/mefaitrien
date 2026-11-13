import prisma from "@@/lib/prisma";
import { REDIS_LONGESTEATER } from "../consts/redisKeys";
import type { LongestEaterDto } from "~/types/dto";

type CachedLongestEater = { userId: number | null; streak: number };

// Longest current run of consecutive registered meals eaten in a cooking group.
const computeLongestEater = async (): Promise<CachedLongestEater> => {
  const registrations = await prisma.washingRegistration.findMany({
    select: {
      cookingGroupId: true,
      assignedDay: {
        select: { day: true, monthRoster: { select: { year: true, month: true } } },
      },
      washingRegistrationEatUsers: { select: { userId: true, amountEat: true } },
    },
  });
  registrations.sort((a, b) =>
    a.assignedDay.monthRoster.year - b.assignedDay.monthRoster.year ||
    a.assignedDay.monthRoster.month - b.assignedDay.monthRoster.month ||
    a.assignedDay.day - b.assignedDay.day
  );

  const streaksByGroup = new Map<number, Map<number, number>>();
  registrations.forEach(({ cookingGroupId, washingRegistrationEatUsers }) => {
    const current = streaksByGroup.get(cookingGroupId) ?? new Map<number, number>();
    streaksByGroup.set(cookingGroupId, current);

    const eaters = new Set(washingRegistrationEatUsers.filter(e => e.amountEat > 0).map(e => e.userId));
    [...current.keys()].forEach(userId => !eaters.has(userId) && current.delete(userId));

    eaters.forEach(userId => {
      const streak = (current.get(userId) ?? 0) + 1;
      current.set(userId, streak);
    });
  });

  let best: CachedLongestEater = { userId: null, streak: 0 };
  streaksByGroup.forEach(current => current.forEach((streak, userId) => {
    if (streak > best.streak) best = { userId, streak };
  }));
  return best;
};

const refreshLongestEater = async (): Promise<CachedLongestEater> => {
  const computed = await computeLongestEater();
  await useStorage("redis").setItem(REDIS_LONGESTEATER, computed);
  return computed;
};

// Call after any washing registration change
export const invalidateLongestEater = async () => {
  await useStorage("redis").removeItem(REDIS_LONGESTEATER);
  await refreshLongestEater();
};

export const getLongestEater = async (): Promise<LongestEaterDto | null> => {
  const { userId, streak } =
    (await useStorage("redis").getItem<CachedLongestEater>(REDIS_LONGESTEATER)) ??
    (await refreshLongestEater());
  if (userId === null) return null;

  // Name is looked up on read so renames never go stale in the cache
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  return user ? { id: user.id, name: user.name, streak } : null;
};
