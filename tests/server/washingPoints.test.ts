import { describe, expect, it } from "vitest";
import { prismaMock } from "../helpers/prisma";
import { redis } from "../helpers/nitro";
import { getWashingPointTotals, invalidateWashingPoints } from "~/server/utils/washingPoints";

type Reg = { washUserOneId: number; washUserTwoId: number; eaters?: [userId: number, amountEat?: number][] };
type U = { id: number; penalties?: number[]; base?: number };

const setup = (users: U[], registrations: Reg[]) => {
	prismaMock.user.findMany.mockResolvedValue(
		users.map(u => ({ id: u.id, washingPenalties: (u.penalties ?? []).map(amount => ({ amount })) })),
	);
	prismaMock.washingRegistration.findMany.mockResolvedValue(
		registrations.map(r => ({
			washUserOneId: r.washUserOneId,
			washUserTwoId: r.washUserTwoId,
			washingRegistrationEatUsers: (r.eaters ?? []).map(([userId, amountEat = 1]) => ({ userId, amountEat })),
		})),
	);
};

const totals = async (users: U[]) =>
	getWashingPointTotals(users.map(u => ({ id: u.id, washingpointsBase: u.base ?? 0, cookingGroupId: 1 })));

const four: U[] = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

describe("washing points", () => {
	it("is all zero without registrations", async () => {
		setup(four, []);
		const result = await totals(four);
		expect([...result.values()].map(t => t.totalPoints)).toEqual([0, 0, 0, 0]);
	});

	it("rewards washers, charges eaters, and averages over active users", async () => {
		// washers get 2+2, eaters -2, everybody -4/4 for the one registration
		setup(four, [{ washUserOneId: 1, washUserTwoId: 2, eaters: [[3], [4]] }]);
		const result = await totals(four);
		expect([1, 2, 3, 4].map(id => result.get(id)!.totalPoints)).toEqual([3, 3, -3, -3]);
	});

	it("keeps the sum over active users at zero (conservation)", async () => {
		const users = [...four, { id: 5 }];
		setup(users, [
			{ washUserOneId: 1, washUserTwoId: 2, eaters: [[3, 2], [4]] },
			{ washUserOneId: 3, washUserTwoId: 5, eaters: [[1], [2], [4, 3]] },
			{ washUserOneId: 4, washUserTwoId: 1 },
		]);
		const result = await totals(users);
		const sum = [...result.values()].reduce((a, t) => a + t.computedPoints, 0);
		expect(sum).toBeCloseTo(0, 0);
	});

	it("counts amountEat for guests: eater pays double, washers earn it", async () => {
		setup(four, [{ washUserOneId: 1, washUserTwoId: 2, eaters: [[3, 3]] }]);
		const result = await totals(four);
		expect(result.get(1)!.computedPoints).toBe(4); // 2+3 -1
		expect(result.get(3)!.computedPoints).toBe(-7); // -6 -1
	});

	it("a cook who ate nothing and washed nothing only gets the averaging charge", async () => {
		setup(four, [{ washUserOneId: 1, washUserTwoId: 2 }]);
		const result = await totals(four);
		expect(result.get(4)!.computedPoints).toBe(-1);
	});

	it("adds base points and subtracts penalties from the total only", async () => {
		const users = [{ id: 1, base: 10, penalties: [2, 3] }, ...four.slice(1)];
		setup(users, []);
		const t = (await totals(users)).get(1)!;
		expect(t).toMatchObject({ basePoints: 10, computedPoints: 0, penaltyPoints: 5, totalPoints: 5 });
	});

	it("negative penalties (corrections) increase the total", async () => {
		const users = [{ id: 1, penalties: [-4] }, ...four.slice(1)];
		setup(users, []);
		expect((await totals(users)).get(1)!.totalPoints).toBe(4);
	});

	it("rounds to one decimal (3 users, 1 registration => -1.3 each)", async () => {
		const three = four.slice(0, 3);
		setup(three, [{ washUserOneId: 1, washUserTwoId: 1 }]); // same washer twice: 2+2 -4/3
		const result = await totals(three);
		expect(result.get(2)!.computedPoints).toBe(-1.3);
		expect(result.get(1)!.computedPoints).toBe(2.7);
	});

	it("same person as both washers is paid twice (current behaviour)", async () => {
		setup(four, [{ washUserOneId: 1, washUserTwoId: 1 }]);
		expect((await totals(four)).get(1)!.computedPoints).toBe(3); // 2*2 -1
	});

	it("inactive users are not part of the averaging divisor", async () => {
		// user 9 is inactive (not returned by findMany) but washed: 2 active users => -4/2 each
		setup([{ id: 1 }, { id: 2 }], [{ washUserOneId: 9, washUserTwoId: 1 }]);
		const result = await totals([{ id: 1 }, { id: 2 }]);
		expect(result.get(1)!.computedPoints).toBe(0); // 2 - 2
		expect(result.get(2)!.computedPoints).toBe(-2);
	});

	it("users unknown to the cache get zero points", async () => {
		setup(four, []);
		const result = await totals([{ id: 42, base: 7 }]);
		expect(result.get(42)).toMatchObject({ computedPoints: 0, penaltyPoints: 0, totalPoints: 7 });
	});

	it("deactivating and reactivating a user keeps their history, only the averaging shifts", async () => {
		const regs: Reg[] = [{ washUserOneId: 4, washUserTwoId: 1, eaters: [[2]] }];

		setup(four, regs);
		expect((await totals(four)).get(4)!.computedPoints).toBe(2); // 2+1 -1

		setup(four.slice(0, 3), regs); // user 4 inactive: divisor 3
		await invalidateWashingPoints();
		const without = await totals(four.slice(0, 3));
		expect(without.get(1)!.computedPoints).toBe(1.7); // 3 - 4/3
		expect(without.get(4)).toBeUndefined();

		setup(four, regs); // reactivated
		await invalidateWashingPoints();
		expect((await totals(four)).get(4)!.computedPoints).toBe(2);
	});

	it("an inactive user's penalties are ignored until they return", async () => {
		const users = [{ id: 1, penalties: [5] }, { id: 2 }];
		setup([{ id: 2 }], []); // user 1 inactive
		expect((await totals(users)).get(1)).toMatchObject({ penaltyPoints: 0, totalPoints: 0 });

		setup(users, []);
		await invalidateWashingPoints();
		expect((await totals(users)).get(1)).toMatchObject({ penaltyPoints: 5, totalPoints: -5 });
	});

	it("with zero active users, computed points are zero", async () => {
		setup([], [{ washUserOneId: 1, washUserTwoId: 2, eaters: [[1, 2]] }]);
		const result = await totals([{ id: 1, base: 3 }, { id: 2 }]);
		expect(result.get(1)).toMatchObject({ computedPoints: 0, totalPoints: 3 });
		expect(result.get(2)!.computedPoints).toBe(0);
	});

	it("returns an empty map and does not touch the db for no users", async () => {
		expect((await getWashingPointTotals([])).size).toBe(0);
		expect(prismaMock.user.findMany).not.toHaveBeenCalled();
	});

	it("serves from cache until invalidated", async () => {
		setup(four, [{ washUserOneId: 1, washUserTwoId: 2 }]);
		await totals(four);
		await totals(four);
		expect(prismaMock.washingRegistration.findMany).toHaveBeenCalledTimes(1);

		setup(four, []);
		expect((await totals(four)).get(1)!.totalPoints).toBe(1); // stale on purpose

		await invalidateWashingPoints();
		expect(redis.size).toBe(1);
		expect((await totals(four)).get(1)!.totalPoints).toBe(0);
	});
});
