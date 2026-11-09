import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../helpers/prisma";

vi.mock("~/server/utils/cookingPoints", () => ({
	getCookingPointTotals: async (users: any[]) =>
		new Map(users.map(u => [u.id, { totalPoints: u.cookingpointsBase }])),
}));

const { default: handler } = await import("~/server/api/cooking/roster/[year]/[month]/auto.post");

type U = { id: number; group?: number | null; points?: number };
type Avail = [userId: number, day: number, type: "UNAVAILABLE" | "NEGATIVE" | "POSITIVE"];

const run = async (
	users: U[],
	opts: { year?: number; month?: number; blocked?: number[]; avail?: Avail[]; groups?: number[]; body?: any } = {},
) => {
	const { year = 2026, month = 11 } = opts;
	prismaMock.monthRoster.findFirst.mockResolvedValue({
		year,
		month,
		blockedDates: (opts.blocked ?? []).map(day => ({ day })),
		availabilities: (opts.avail ?? []).map(([userId, day, availability]) => ({ userId, day, availability })),
	});
	prismaMock.user.findMany.mockResolvedValue(
		users.map(u => ({ id: u.id, name: `u${u.id}`, cookingGroupId: u.group === undefined ? 1 : u.group, cookingpointsBase: u.points ?? 0 })),
	);
	prismaMock.cookingGroup.findMany.mockResolvedValue((opts.groups ?? [1, 2]).map(id => ({ id, name: `g${id}` })));
	return (handler as any)({
		params: { year: String(year), month: String(month) },
		body: opts.body ?? {},
	}) as Promise<{ groupId: number; groupName: string; availabilities: { day: number; userId: number }[] }[]>;
};

// Block everything except one day so only cost logic decides the cook (Nov 2026 has 30 days)
const onlyDay = (d: number) => Array.from({ length: 30 }, (_, i) => i + 1).filter(x => x !== d);
const cookOn = async (users: U[], avail: Avail[] = []) =>
	(await run(users, { blocked: onlyDay(10), avail }))[0].availabilities[0].userId;

const weekOf = (day: number) => Math.floor((day - 1 + 6) / 7); // 1 Nov 2026 is a Sunday

beforeEach(() => {
	vi.useFakeTimers({ toFake: ["Date"] });
	vi.setSystemTime(new Date(2026, 10, 9));
});
afterEach(() => vi.useRealTimers());

describe("auto-assign preview", () => {
	it("assigns every unblocked day exactly once, and never writes", async () => {
		const [group] = await run([{ id: 1 }, { id: 2 }, { id: 3 }], { blocked: [5, 6] });

		const days = group.availabilities.map(a => a.day);
		expect(days).toEqual(Array.from({ length: 30 }, (_, i) => i + 1).filter(d => d !== 5 && d !== 6));
		expect(prismaMock.assignedDay.createMany).not.toHaveBeenCalled();
		expect(prismaMock.assignedDay.deleteMany).not.toHaveBeenCalled();
	});

	it("never repeats a cook within a Mon-Sun week when there are enough cooks", async () => {
		const [group] = await run(Array.from({ length: 7 }, (_, i) => ({ id: i + 1 })));

		const seen = new Set<string>();
		for (const { day, userId } of group.availabilities) {
			const key = `${weekOf(day)}:${userId}`;
			expect(seen.has(key), `user ${userId} cooks twice in week ${weekOf(day)}`).toBe(false);
			seen.add(key);
		}
	});

	it("falls back to repeats when a week has more days than cooks", async () => {
		const [group] = await run([{ id: 1 }, { id: 2 }]);
		expect(group.availabilities).toHaveLength(30);
		expect(new Set(group.availabilities.map(a => a.userId))).toEqual(new Set([1, 2]));
	});

	it("a single-person group cooks every day", async () => {
		const [group] = await run([{ id: 1 }]);
		expect(group.availabilities.every(a => a.userId === 1)).toBe(true);
	});

	it("spreads load roughly evenly over equal cooks", async () => {
		const [group] = await run([{ id: 1 }, { id: 2 }, { id: 3 }]);
		const perUser = [1, 2, 3].map(id => group.availabilities.filter(a => a.userId === id).length);
		expect(Math.max(...perUser) - Math.min(...perUser)).toBeLessThanOrEqual(1);
	});

	it("gives people with fewer cooking points more days", async () => {
		const [group] = await run([{ id: 1, points: 0 }, { id: 2, points: 8 }]);
		const count = (id: number) => group.availabilities.filter(a => a.userId === id).length;
		expect(count(1)).toBeGreaterThan(count(2));
	});

	describe("choosing a cook for one day", () => {
		it("takes the lowest points", async () => {
			expect(await cookOn([{ id: 1, points: 5 }, { id: 2, points: 0 }, { id: 3, points: 2 }])).toBe(2);
		});

		it("breaks ties by lowest user id", async () => {
			expect(await cookOn([{ id: 7 }, { id: 3 }, { id: 5 }])).toBe(3);
		});

		it("never picks an UNAVAILABLE user, even the one furthest behind", async () => {
			expect(await cookOn([{ id: 1, points: -50 }, { id: 2 }], [[1, 10, "UNAVAILABLE"]])).toBe(2);
		});

		it("POSITIVE preference (-2) can win over one point less", async () => {
			expect(await cookOn([{ id: 1, points: 0 }, { id: 2, points: 1 }], [[2, 10, "POSITIVE"]])).toBe(2);
		});

		it("NEGATIVE preference (+3) loses against a few points more", async () => {
			expect(await cookOn([{ id: 1, points: 0 }, { id: 2, points: 2 }], [[1, 10, "NEGATIVE"]])).toBe(2);
		});

		it("NEGATIVE is only a nudge: someone far behind still cooks", async () => {
			expect(await cookOn([{ id: 1, points: -10 }, { id: 2, points: 0 }], [[1, 10, "NEGATIVE"]])).toBe(1);
		});

		it("ignores availability rows of other days", async () => {
			expect(await cookOn([{ id: 1 }, { id: 2 }], [[1, 11, "UNAVAILABLE"]])).toBe(1);
		});
	});

	it("returns 409 when everyone is unavailable on a day", async () => {
		await expect(run([{ id: 1 }, { id: 2 }], { avail: [[1, 12, "UNAVAILABLE"], [2, 12, "UNAVAILABLE"]] }))
			.rejects.toMatchObject({ statusCode: 409 });
	});

	it("handles one group separately from another", async () => {
		const result = await run([{ id: 1, group: 1 }, { id: 2, group: 2 }, { id: 3, group: null }]);
		expect(result.map(g => g.groupId).sort()).toEqual([1, 2]); // user without group creates no entry
		expect(result.find(g => g.groupId === 1)!.availabilities.every(a => a.userId === 1)).toBe(true);
		expect(result.find(g => g.groupId === 2)!.availabilities.every(a => a.userId === 2)).toBe(true);
	});

	it("limits to the requested groups", async () => {
		const result = await run([{ id: 1, group: 1 }, { id: 2, group: 2 }], { body: { cookingGroups: [2] } });
		expect(result.map(g => g.groupId)).toEqual([2]);
	});

	it("rejects an unknown group with 400", async () => {
		await expect(run([{ id: 1 }], { body: { cookingGroups: [99] } })).rejects.toMatchObject({ statusCode: 400 });
	});

	it("rejects a requested group without members with 409 (nobody available)", async () => {
		await expect(run([{ id: 1, group: 1 }], { body: { cookingGroups: [2] } })).rejects.toMatchObject({
			statusCode: 409,
		});
	});

	it("returns 404 for a roster that does not exist", async () => {
		prismaMock.monthRoster.findFirst.mockResolvedValue(null);
		await expect(
			(handler as any)({ params: { year: "2026", month: "11" }, body: {} }),
		).rejects.toMatchObject({ statusCode: 404 });
	});

	it("only considers active users for current/future months, everybody for past months", async () => {
		await run([{ id: 1 }], { month: 11 });
		expect(prismaMock.user.findMany).toHaveBeenLastCalledWith({ where: { isActive: true } });

		await run([{ id: 1 }], { year: 2026, month: 10 });
		expect(prismaMock.user.findMany).toHaveBeenLastCalledWith({ where: {} });
	});

	it("handles a month with every day blocked", async () => {
		const [group] = await run([{ id: 1 }], { blocked: onlyDay(0) });
		expect(group.availabilities).toEqual([]);
	});

	it("rejects a non-numeric month with 400", async () => {
		await expect((handler as any)({ params: { year: "2026", month: "abc" }, body: {} })).rejects.toMatchObject({
			statusCode: 400,
		});
	});
});
