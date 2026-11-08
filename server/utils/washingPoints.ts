import prisma from "@@/lib/prisma";
import { REDIS_WASHINGPOUINTS } from "../consts/redisKeys";

type UserWashingPointsBase = {
  id: number;
  washingpointsBase: number;
  cookingGroupId: number | null;
};

export type WashingPointTotals = {
  basePoints: number;
  computedPoints: number;
  penaltyPoints: number;
  totalPoints: number;
};

const roundPoints = (points: number) => Math.round((points + Number.EPSILON) * 10) / 10;

// userId -> computed (unrounded) and penalty points, for every user involved
type ComputedWashingPoints = Record<number, { computedPoints: number; penaltyPoints: number }>;

// TODO: What if a person changes cooking group?
// The old records should then persist but their computed points may need to be change
const computeWashingPoints = async (): Promise<ComputedWashingPoints> => {
  const [allActiveUsers, relevantRegistrations] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        washingPenalties: true,
      }
    }),
    prisma.washingRegistration.findMany({
      select: {
        washUserOneId: true,
        washUserTwoId: true,
        washingRegistrationEatUsers: {
          select: {
            userId: true,
            amountEat: true,
          },
        },
      },
    }),
  ])
  const allRegistrations = relevantRegistrations.length

  const penaltyPointsByUser = new Map<number, number>(allActiveUsers.map(user => {
    return [user.id, user.washingPenalties.reduce((total, penalty) => total + penalty.amount, 0)];
  }));

  const computedPointsByUser = new Map<number, number>();

  const addPoints = (userId: number, points: number) => {
    computedPointsByUser.set(
      userId,
      (computedPointsByUser.get(userId) ?? 0) + points
    );
  };

  relevantRegistrations.forEach(registration => {
    // TODO: Check if washUserOneId and washUserTwoId are sane
    const totalEats = registration.washingRegistrationEatUsers.reduce((a, c) => a + c.amountEat, 0)

    // Each person washing gets 2 points base
    // plus 2x every eater
    addPoints(registration.washUserOneId, 2 + totalEats)
    addPoints(registration.washUserTwoId, 2 + totalEats)

    // Every person eating gets 2 points removed per eater
    registration.washingRegistrationEatUsers.forEach(eatUser => {
      addPoints(eatUser.userId, -2 * eatUser.amountEat)
    })
  });

  // Then to average this out, we had n registrations where we added 4 points,
  // to a system of m users,
  // So, we remove from all n * (4/m)
  const activeUserCount = allActiveUsers.length;
  const activeUserModifierAverager = - 4 / activeUserCount

  allActiveUsers.forEach(activeUser => {
    addPoints(activeUser.id, allRegistrations * activeUserModifierAverager)
  })

  const result: ComputedWashingPoints = {};
  new Set([...computedPointsByUser.keys(), ...penaltyPointsByUser.keys()]).forEach(id => {
    result[id] = {
      computedPoints: computedPointsByUser.get(id) ?? 0,
      penaltyPoints: penaltyPointsByUser.get(id) ?? 0,
    };
  });
  return result;
};

const refreshWashingPoints = async (): Promise<ComputedWashingPoints> => {
  const computed = await computeWashingPoints();
  await useStorage('redis').setItem(REDIS_WASHINGPOUINTS, computed);
  return computed;
};

// Call after any washing registration, penalty or active-user change
export const invalidateWashingPoints = async () => {
  await useStorage('redis').removeItem(REDIS_WASHINGPOUINTS);
  await refreshWashingPoints();
};

export const getWashingPointTotals = async (
  users: readonly UserWashingPointsBase[]
): Promise<Map<number, WashingPointTotals>> => {
  if (users.length === 0) {
    return new Map();
  }

  const computed =
    (await useStorage('redis').getItem<ComputedWashingPoints>(REDIS_WASHINGPOUINTS)) ??
    (await refreshWashingPoints());

  return new Map(
    users.map(({ id, washingpointsBase }) => {
      const { computedPoints, penaltyPoints } = computed[id] ?? { computedPoints: 0, penaltyPoints: 0 };
      return [
        id,
        {
          basePoints: washingpointsBase,
          computedPoints: roundPoints(computedPoints),
          penaltyPoints,
          totalPoints: roundPoints(washingpointsBase + computedPoints - penaltyPoints),
        },
      ];
    })
  );
};
