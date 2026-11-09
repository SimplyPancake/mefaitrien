import { describe, expect, it } from "vitest";
import { prismaMock } from "../helpers/prisma";
import { getCookingPointTotals, invalidateCookingPoints } from "~/server/utils/cookingPoints";

const counts = (c: Record<number, number>) =>
	prismaMock.assignedDay.groupBy.mockResolvedValue(
		Object.entries(c).map(([userId, n]) => ({ userId: Number(userId), _count: { _all: n } })),
	);

describe("cooking points", () => {
	it("is base points + number of assigned days", async () => {
		counts({ 1: 4, 2: 1 });
		const result = await getCookingPointTotals([
			{ id: 1, cookingpointsBase: 0 },
			{ id: 2, cookingpointsBase: -3 },
			{ id: 3, cookingpointsBase: 5 }, // never cooked
		]);
		expect(result.get(1)).toEqual({ basePoints: 0, computedPoints: 4, totalPoints: 4 });
		expect(result.get(2)!.totalPoints).toBe(-2);
		expect(result.get(3)).toEqual({ basePoints: 5, computedPoints: 0, totalPoints: 5 });
	});

	it("returns an empty map without querying for no users", async () => {
		expect((await getCookingPointTotals([])).size).toBe(0);
		expect(prismaMock.assignedDay.groupBy).not.toHaveBeenCalled();
	});

	it("uses the cache until invalidated (stale after assign without invalidation)", async () => {
		counts({ 1: 1 });
		const user = [{ id: 1, cookingpointsBase: 0 }];
		await getCookingPointTotals(user);

		counts({ 1: 2 });
		expect((await getCookingPointTotals(user)).get(1)!.totalPoints).toBe(1);

		await invalidateCookingPoints();
		expect((await getCookingPointTotals(user)).get(1)!.totalPoints).toBe(2);
	});
});
