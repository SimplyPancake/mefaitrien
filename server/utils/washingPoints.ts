import prisma from "@@/lib/prisma";

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

// TODO: What if a person changes cooking group?
// The old records should then persist but their computed points may need to be change
export const getWashingPointTotals = async (
  users: readonly UserWashingPointsBase[]
): Promise<Map<number, WashingPointTotals>> => {
  if (users.length === 0) {
    return new Map();
  }

  const userIds = users.map(({ id }) => id);
  const groupIds = [
    ...new Set(
      users.flatMap(({ cookingGroupId }) =>
        cookingGroupId === null ? [] : [cookingGroupId]
      )
    ),
  ];
  const [registrations, groupMemberCounts, penalties] = await Promise.all([
    prisma.washingRegistration.findMany({
      where: {
        OR: [
          { cookingGroupId: { in: groupIds } },
          { washUserOneId: { in: userIds } },
          { washUserTwoId: { in: userIds } },
          { washingRegistrationEatUsers: { some: { userId: { in: userIds } } } },
        ],
      },
      select: {
        cookingGroupId: true,
        washUserOneId: true,
        washUserTwoId: true,
        washingRegistrationEatUsers: {
          select: { userId: true, amountEat: true },
        },
      },
    }),
    groupIds.length > 0
      ? prisma.user.groupBy({
          by: ["cookingGroupId"],
          where: { cookingGroupId: { in: groupIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    prisma.washingPenalty.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _sum: { amount: true },
    }),
  ]);
  const groupMemberCountById = new Map(
    groupMemberCounts.map(({ cookingGroupId, _count }) => [
      cookingGroupId,
      _count._all,
    ])
  );
  const penaltyPointsByUser = new Map(
    penalties.map(({ userId, _sum }) => [userId, _sum.amount ?? 0])
  );
  const computedPointsByUser = new Map(userIds.map((id) => [id, 0]));
  const addPoints = (userId: number, points: number) => {
    computedPointsByUser.set(
      userId,
      (computedPointsByUser.get(userId) ?? 0) + points
    );
  };

  for (const registration of registrations) {
    const totalEaters = registration.washingRegistrationEatUsers.reduce(
      (total, eater) => total + eater.amountEat,
      0
    );
    const washerIds = [
      registration.washUserOneId,
      registration.washUserTwoId,
    ];
    for (const userId of washerIds) {
      addPoints(userId, 2);
    }
    for (const userId of new Set(washerIds)) {
      addPoints(userId, 2 * totalEaters);
    }
    for (const eater of registration.washingRegistrationEatUsers) {
      addPoints(eater.userId, -2 * eater.amountEat);
    }

    const memberCount =
      groupMemberCountById.get(registration.cookingGroupId) ?? 0;
    if (memberCount > 0) {
      for (const user of users) {
        if (user.cookingGroupId === registration.cookingGroupId) {
          addPoints(user.id, -4 / memberCount);
        }
      }
    }
  }

  return new Map(
    users.map(({ id, washingpointsBase }) => {
      const computedPoints = computedPointsByUser.get(id) ?? 0;
      const penaltyPoints = penaltyPointsByUser.get(id) ?? 0;
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
