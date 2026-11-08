import prisma from "@@/lib/prisma";
import { REDIS_LONGESTEATER } from "../consts/redisKeys";
import type { LongestEaterDto } from "~/types/dto";

type CachedLongestEater = { userId: number | null; streak: number };

// Longest run of consecutive registrations (chronological) a user ate along
const computeLongestEater = async (): Promise<CachedLongestEater> => {
  const registrations = await prisma.washingRegistration.findMany({
    select: {
      assignedDay: { select: { day: true, monthRoster: { select: { year: true, month: true } } } },
      washingRegistrationEatUsers: { select: { userId: true, amountEat: true } },
    },
  });
  registrations.sort((a, b) =>
    a.assignedDay.monthRoster.year - b.assignedDay.monthRoster.year ||
    a.assignedDay.monthRoster.month - b.assignedDay.monthRoster.month ||
    a.assignedDay.day - b.assignedDay.day
  );

  const current = new Map<number, number>();
  let best: CachedLongestEater = { userId: null, streak: 0 };
  registrations.forEach(({ washingRegistrationEatUsers }) => {
    const eaters = new Set(washingRegistrationEatUsers.filter(e => e.amountEat > 0).map(e => e.userId));
    // Anyone not eating this registration loses their streak
    [...current.keys()].forEach(userId => eaters.has(userId) || current.delete(userId));
    eaters.forEach(userId => {
      const streak = (current.get(userId) ?? 0) + 1;
      current.set(userId, streak);
      if (streak > best.streak) best = { userId, streak };
    });
  });
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
