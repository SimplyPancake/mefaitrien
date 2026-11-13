import { describe, expect, it } from "vitest";
import { prismaMock } from "../helpers/prisma";
import { getLongestEater } from "~/server/utils/longestEater";

type Meal = {
	date: [year: number, month: number, day: number];
	group?: number;
	cook?: number;
	washers?: [number, number];
	eaters?: number[];
};

const meals = (list: Meal[]) => {
	prismaMock.washingRegistration.findMany.mockResolvedValue(
		list.map(m => ({
			cookingGroupId: m.group ?? 1,
			washUserOneId: (m.washers ?? [90, 91])[0],
			washUserTwoId: (m.washers ?? [90, 91])[1],
			assignedDay: {
				day: m.date[2],
				userId: m.cook ?? 99,
				monthRoster: { year: m.date[0], month: m.date[1] },
			},
			washingRegistrationEatUsers: (m.eaters ?? []).map(userId => ({ userId, amountEat: 1 })),
		})),
	);
	prismaMock.user.findUnique.mockImplementation(async ({ where }: any) => ({ id: where.id, name: `user${where.id}` }));
};

const day = (d: number, extra: Partial<Meal> = {}): Meal => ({ date: [2026, 11, d], ...extra });

describe("longest eater", () => {
	it("is null without registrations", async () => {
		meals([]);
		expect(await getLongestEater()).toBeNull();
	});

	it("counts consecutive meals eaten", async () => {
		meals([day(1, { eaters: [1] }), day(2, { eaters: [1] }), day(3, { eaters: [1, 2] })]);
		expect(await getLongestEater()).toEqual({ id: 1, name: "user1", streak: 3 });
	});

	it("is broken by a meal the user skipped", async () => {
		meals([day(1, { eaters: [1] }), day(2, { eaters: [1] }), day(3, { eaters: [2] }), day(4, { eaters: [1] })]);
		expect(await getLongestEater()).toEqual({ id: 1, name: "user1", streak: 2 });
	});

	it("eating while cooking still extends the streak", async () => {
		meals([day(1, { eaters: [1] }), day(2, { cook: 1, eaters: [1] }), day(3, { washers: [1, 2], eaters: [1] })]);
		expect((await getLongestEater())!.streak).toBe(3);
	});

	it("breaks the streak on a meal not eaten, regardless of cooking or washing", async () => {
		meals([
			day(1, { eaters: [1] }),
			day(2, { cook: 1 }),
			day(3, { washers: [1, 2] }),
			day(4, { eaters: [1] }),
		]);
		expect((await getLongestEater())!.streak).toBe(1);
	});

	it("counts consecutive cooking meals across blocked weekend dates", async () => {
		const weekdays = [2, 3, 4, 5, 6, 9, 10, 11, 12, 13];
		meals(weekdays.map(d => day(d, { eaters: [1] })));
		expect(await getLongestEater()).toMatchObject({ id: 1, streak: 10 });
	});

	it("sorts by date, not by fetch order, and across months/years", async () => {
		meals([
			{ date: [2027, 1, 1], eaters: [1] },
			{ date: [2026, 12, 31], eaters: [1] },
			{ date: [2026, 12, 30], eaters: [2] },
		]);
		expect(await getLongestEater()).toMatchObject({ id: 1, streak: 2 });
	});

	it("keeps separate timelines per cooking group", async () => {
		meals([
			day(1, { group: 1, eaters: [1] }),
			day(1, { group: 2, eaters: [2] }),
			day(2, { group: 1, eaters: [1] }),
			day(2, { group: 2, eaters: [2] }),
		]);
		// group 2's meals must not break user 1's streak
		expect(await getLongestEater()).toMatchObject({ id: 1, streak: 2 });
	});

	it("a later streak beats an earlier shorter one", async () => {
		meals([day(1, { eaters: [1] }), day(2, { eaters: [1, 2] }), day(3, { eaters: [2] }), day(4, { eaters: [2] })]);
		// user 2 reaches 3 later, so user 2 wins; user 1 only has 2
		expect(await getLongestEater()).toMatchObject({ id: 2, streak: 3 });
	});

	it("keeps the first user to reach a tied streak", async () => {
		meals([day(1, { eaters: [1, 2] }), day(2, { eaters: [1, 2] })]);
		expect((await getLongestEater())!.id).toBe(1);
	});

	it("ignores eaters with amountEat 0", async () => {
		prismaMock.washingRegistration.findMany.mockResolvedValue([
			{
				cookingGroupId: 1,
				washUserOneId: 90,
				washUserTwoId: 91,
				assignedDay: { day: 1, userId: 99, monthRoster: { year: 2026, month: 11 } },
				washingRegistrationEatUsers: [
					{ userId: 1, amountEat: 0 },
				],
			},
		]);
		expect(await getLongestEater()).toBeNull();
	});

	it("is null when the best eater no longer exists", async () => {
		meals([day(1, { eaters: [1] })]);
		prismaMock.user.findUnique.mockResolvedValue(null);
		expect(await getLongestEater()).toBeNull();
	});
});
