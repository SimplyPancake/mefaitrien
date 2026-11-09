import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = { id: number; day: number; cookingGroupId: number; userId: number; monthRosterId: number };

// In-memory stand-in for the DB that enforces WashingRegistration.assignedDayId -> AssignedDay.id
const db = vi.hoisted(() => {
	const state = {
		assignedDays: [] as Row[],
		washingRegistrations: [] as { assignedDayId: number }[],
		userGroup: {} as Record<number, number>, // defaults to group 1
		blockedDates: [] as { day: number }[],
		nextId: 1,
	};
	const matches = (row: Row, where: any) =>
		(where.id?.in ? where.id.in.includes(row.id) : true) &&
		(where.monthRosterId === undefined || where.monthRosterId === row.monthRosterId) &&
		(where.cookingGroupId === undefined || where.cookingGroupId === row.cookingGroupId);

	const tx = {
		user: {
			findMany: async ({ where }: any) =>
				where.id.in.map((id: number) => ({ id, cookingGroupId: state.userGroup[id] ?? 1 })),
		},
		cookingGroup: { findUnique: async ({ where }: any) => ({ id: where.id }) },
		monthRoster: { update: async () => ({}) },
		assignedDay: {
			findMany: async ({ where }: any) =>
				state.assignedDays.filter(r => matches(r, where)).map(r => ({
					...r,
					washingRegistration: state.washingRegistrations.some(w => w.assignedDayId === r.id)
						? { id: 1 }
						: null,
				})),
			deleteMany: async ({ where }: any) => {
				const doomed = state.assignedDays.filter(r => matches(r, where));
				if (doomed.some(r => state.washingRegistrations.some(w => w.assignedDayId === r.id))) {
					throw Object.assign(new Error("Foreign key constraint violated on the fields: (`assignedDayId`)"), {
						code: "P2003",
					});
				}
				state.assignedDays = state.assignedDays.filter(r => !doomed.includes(r));
			},
			update: async ({ where, data }: any) => {
				Object.assign(state.assignedDays.find(r => r.id === where.id)!, data);
			},
			createMany: async ({ data }: any) => {
				for (const row of data) state.assignedDays.push({ id: state.nextId++, ...row });
			},
		},
	};

	const prisma = {
		monthRoster: {
			findUnique: async () => ({ id: 10, year: 2026, month: 11, blockedDates: state.blockedDates }),
		},
		$transaction: async (fn: any) => fn(tx),
	};
	return { state, prisma };
});

vi.mock("@@/lib/prisma", () => ({ default: db.prisma }));
vi.mock("~/server/utils/cookingPoints", () => ({ invalidateCookingPoints: async () => {} }));
// Skip auth; hand the handler a ready-made event with the body already cast.
vi.mock("~/server/utils/handlers/baseEventHandler", () => ({
	BaseEventHandler: class {
		constructor(private event: any, private fn: any) {}
		async handle() {
			this.event.data = this.event.body;
			return this.fn(this.event);
		}
	},
}));

vi.stubGlobal("defineEventHandler", (fn: any) => fn);
vi.stubGlobal("getRouterParams", () => ({ year: "2026", month: "11" }));
vi.stubGlobal("createError", (e: any) => Object.assign(new Error(e.statusMessage), e));

const { default: handler } = await import("~/server/api/cooking/roster/[year]/[month]/assign.post");

const post = (assignments: { groupId: number; userId: number; day: number }[]) =>
	handler({ body: { assignments } } as any);

const seed = (days: [id: number, day: number, userId: number][]) => {
	db.state.assignedDays = days.map(([id, day, userId]) => ({
		id,
		day,
		userId,
		cookingGroupId: 1,
		monthRosterId: 10,
	}));
	db.state.nextId = 100;
};

describe("POST /api/cooking/roster/:year/:month/assign", () => {
	beforeEach(() => {
		db.state.washingRegistrations = [];
		db.state.userGroup = {};
		db.state.blockedDates = [];
		seed([[1, 1, 5], [2, 2, 6]]);
	});

	it("keeps already-assigned days that have a washing registration (FK regression)", async () => {
		db.state.washingRegistrations = [{ assignedDayId: 1 }];

		await post([
			{ groupId: 1, userId: 5, day: 1 },
			{ groupId: 1, userId: 7, day: 3 },
		]);

		const ids = db.state.assignedDays.map(r => r.id);
		expect(ids).toContain(1); // not deleted/recreated, so the registration still points at it
		expect(db.state.assignedDays.map(r => r.day).sort()).toEqual([1, 3]);
	});

	it("updates the cook on an existing day in place", async () => {
		db.state.washingRegistrations = [{ assignedDayId: 1 }];

		await post([{ groupId: 1, userId: 9, day: 1 }, { groupId: 1, userId: 6, day: 2 }]);

		expect(db.state.assignedDays.find(r => r.id === 1)?.userId).toBe(9);
	});

	it("rejects removing a day that has a washing registration with 409", async () => {
		db.state.washingRegistrations = [{ assignedDayId: 1 }];

		await expect(post([{ groupId: 1, userId: 6, day: 2 }])).rejects.toMatchObject({ statusCode: 409 });
	});

	it("removes unregistered days that are no longer assigned", async () => {
		await post([{ groupId: 1, userId: 5, day: 1 }]);

		expect(db.state.assignedDays.map(r => r.day)).toEqual([1]);
	});

	it("an empty assignment clears unregistered days", async () => {
		await post([]);

		expect(db.state.assignedDays).toEqual([]);
	});

	it("rejects a day beyond the end of the month (31 Nov)", async () => {
		await expect(post([{ groupId: 1, userId: 5, day: 31 }])).rejects.toMatchObject({ statusCode: 400 });
	});

	it("keeps an unchanged cook on a blocked day and still saves the rest", async () => {
		db.state.blockedDates = [{ day: 1 }];
		await post([
			{ groupId: 1, userId: 5, day: 1 },
			{ groupId: 1, userId: 7, day: 3 },
		]);
		expect(db.state.assignedDays.find(r => r.day === 1)).toMatchObject({ id: 1, userId: 5 });
		expect(db.state.assignedDays.some(r => r.day === 3 && r.userId === 7)).toBe(true);
	});

	it("rejects a new or changed cook on a blocked day and writes nothing", async () => {
		db.state.blockedDates = [{ day: 3 }];
		await expect(post([{ groupId: 1, userId: 5, day: 3 }])).rejects.toMatchObject({ statusCode: 400 });
		db.state.blockedDates = [{ day: 1 }];
		await expect(post([{ groupId: 1, userId: 9, day: 1 }])).rejects.toMatchObject({ statusCode: 400 });
		expect(db.state.assignedDays.map(r => [r.day, r.userId])).toEqual([[1, 5], [2, 6]]);
	});

	it("allows the same calendar day in two groups", async () => {
		db.state.userGroup = { 8: 2 };
		await post([
			{ groupId: 1, userId: 5, day: 1 },
			{ groupId: 1, userId: 6, day: 2 },
			{ groupId: 2, userId: 8, day: 1 },
		]);
		expect(db.state.assignedDays.filter(r => r.day === 1).map(r => r.cookingGroupId).sort()).toEqual([1, 2]);
	});

	it("rejects two cooks on the same day in one group, and changes nothing", async () => {
		await expect(
			post([{ groupId: 1, userId: 5, day: 4 }, { groupId: 1, userId: 6, day: 4 }]),
		).rejects.toMatchObject({ statusCode: 400 });

		expect(db.state.assignedDays.map(r => r.day)).toEqual([1, 2]);
	});

	it("with a groupId, leaves other groups' days alone", async () => {
		db.state.assignedDays.push({ id: 50, day: 9, userId: 8, cookingGroupId: 2, monthRosterId: 10 });
		db.state.washingRegistrations = [{ assignedDayId: 50 }];

		await handler({ body: { groupId: 1, assignments: [{ groupId: 1, userId: 5, day: 1 }] } } as any);

		expect(db.state.assignedDays.map(r => r.id).sort((a, b) => a - b)).toEqual([1, 50]);
	});

	it("with a groupId, rejects assignments for a different group", async () => {
		await expect(
			handler({ body: { groupId: 1, assignments: [{ groupId: 2, userId: 5, day: 1 }] } } as any),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("is idempotent: submitting the same roster twice keeps ids stable", async () => {
		db.state.washingRegistrations = [{ assignedDayId: 1 }, { assignedDayId: 2 }];
		const same = [{ groupId: 1, userId: 5, day: 1 }, { groupId: 1, userId: 6, day: 2 }];

		await post(same);
		await post(same);

		expect(db.state.assignedDays.map(r => r.id)).toEqual([1, 2]);
	});

	describe("housemates who moved group or became inactive", () => {
		it("re-saving unchanged days still works when the cook has since moved to another group", async () => {
			db.state.userGroup = { 5: 2 };
			db.state.washingRegistrations = [{ assignedDayId: 1 }];

			await post([{ groupId: 1, userId: 5, day: 1 }, { groupId: 1, userId: 6, day: 2 }, { groupId: 1, userId: 7, day: 3 }]);

			expect(db.state.assignedDays.map(r => r.id)).toContain(1);
			expect(db.state.assignedDays).toHaveLength(3);
		});

		it("still refuses to newly assign someone who is not in the group", async () => {
			db.state.userGroup = { 5: 2 };

			await expect(post([{ groupId: 1, userId: 5, day: 4 }])).rejects.toMatchObject({ statusCode: 400 });
		});

		it("refuses to hand an existing day to a moved user (only unchanged days are grandfathered)", async () => {
			db.state.userGroup = { 9: 2 };

			await expect(post([{ groupId: 1, userId: 9, day: 1 }])).rejects.toMatchObject({ statusCode: 400 });
		});

		it("a moved cook's registered day can be taken over by a current member", async () => {
			db.state.userGroup = { 5: 2 };
			db.state.washingRegistrations = [{ assignedDayId: 1 }];

			await post([{ groupId: 1, userId: 6, day: 1 }, { groupId: 1, userId: 6, day: 2 }]);

			expect(db.state.assignedDays.find(r => r.id === 1)?.userId).toBe(6);
		});
	});
});
