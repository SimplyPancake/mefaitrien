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

  const userIds = users.map(u => u.id);

  const [allActiveUsers, relevantRegistrations, registrationDays, absences] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        isActive: true,
        washingpointsBase: true,
        washingPenalties: true,
      }
    }),
    prisma.washingRegistration.findMany({
      select: {
        washUserOneId: true,
        washUserTwoId: true,
        cookingGroupId: true,
        washingRegistrationEatUsers: {
          select: {
            userId: true,
            amountEat: true,
            user: {
              select: {
                isActive: true,
              },
            },
          },
        },
      },
      where: {
        OR: [
          {
            washingRegistrationEatUsers: {
              some: {
                userId: { in: userIds },
              },
            },
          },
          {
            washUserOneId: { in: userIds },
          },
          {
            washUserTwoId: { in: userIds },
          },
        ],
      },
    }),
    prisma.washingRegistration.findMany({
      select: {
        assignedDay: {
          select: {
            day: true,
            monthRoster: {
              select: { year: true, month: true },
            },
          },
        },
      },
    }),
    prisma.absence.findMany({
      select: {
        userId: true,
        start: true,
        end: true,
      },
    }),
  ])


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
  const amountEatByUser = new Map(registration.washingRegistrationEatUsers.map(
    u => [u.userId, u.amountEat]
  ))
  // Reduce get total eat from that registration
  const totalEats = amountEatByUser.values().reduce((a, c) => a + c)

  // Each person washing gets 2 points base
  // plus 2x every eater
  addPoints(registration.washUserOneId, 2 + totalEats)
  addPoints(registration.washUserTwoId, 2 + totalEats)

  // Every person eating gets 2 points removed per eater
  registration.washingRegistrationEatUsers.forEach(eatUser => {
    addPoints(eatUser.userId, -2 * eatUser.amountEat)
  })
});

// Actief ga weg return date lijst
// Then to average this out, we had n registrations where we added 4 points,
// to a system of m users,
// So, we remove from all n * (4/m)
const activeUserCount = allActiveUsers.length;
const activeUserModifierAverager = activeUserCount > 0 ? -4 / activeUserCount : 0;

allActiveUsers.forEach(activeUser => {
  addPoints(activeUser.id, registrationDays.length * activeUserModifierAverager)
});

const registrationDateKeys = registrationDays.map(({ assignedDay }) =>
  `${assignedDay.monthRoster.year}-${String(assignedDay.monthRoster.month).padStart(2, "0")}-${String(assignedDay.day).padStart(2, "0")}`
);
const absenceDateRangesByUser = new Map<number, Array<{ start: string; end: string | null }>>();
absences.forEach((absence) => {
  const dateRanges = absenceDateRangesByUser.get(absence.userId) ?? [];
  dateRanges.push({
    start: absence.start.toISOString().slice(0, 10),
    end: absence.end?.toISOString().slice(0, 10) ?? null,
  });
  absenceDateRangesByUser.set(absence.userId, dateRanges);
});

allActiveUsers.forEach((activeUser) => {
  const absenceDateRanges = absenceDateRangesByUser.get(activeUser.id);
  if (!absenceDateRanges?.length) return;

  const coveredRegistrationDays = registrationDateKeys.filter((registrationDate) =>
    absenceDateRanges.some(
      ({ start, end }) => registrationDate >= start && (!end || registrationDate <= end)
    )
  ).length;

  addPoints(activeUser.id, coveredRegistrationDays * -activeUserModifierAverager);
});

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
