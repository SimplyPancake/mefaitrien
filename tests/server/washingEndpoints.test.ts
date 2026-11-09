import { describe, expect, it, vi } from "vitest";
import { prismaMock } from "../helpers/prisma";

const invalidateWashingPoints = vi.hoisted(() => vi.fn());
const invalidateLongestEater = vi.hoisted(() => vi.fn());
vi.mock("~/server/utils/washingPoints", () => ({ invalidateWashingPoints }));
vi.mock("~/server/utils/longestEater", () => ({ invalidateLongestEater }));

const { default: fill } = await import("~/server/api/washing/fill.post");
const { default: del } = await import("~/server/api/washing/registrations/delete.post");
const { default: penalty } = await import("~/server/api/washing/penalty.post");

const call = (handler: any, body: any) => handler({ body });

// group 1 cooks on day 5; users 1,2 are active washers, 3 is in group 1, 4 in group 2
const given = (activeIds: number[] = [1, 2, 3], groupOf: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 2 }) => {
	prismaMock.assignedDay.findUnique.mockResolvedValue({ cookingGroupId: 1 });
	prismaMock.user.findMany.mockImplementation(async ({ where }: any) => {
		const washers: number[] = where.OR[0].id.in;
		const eaters: number[] = where.OR[1].id.in;
		const ids = [
			...washers,
			...eaters.filter(id => groupOf[id] === where.OR[1].cookingGroupId),
		];
		return ids.filter(id => activeIds.includes(id)).map(id => ({ id }));
	});
	prismaMock.washingRegistration.upsert.mockResolvedValue({});
};

const base = { assignedDayId: 5, washUserOneId: 1, washUserTwoId: 2, eaters: [{ userId: 3, amountEat: 1 }] };

describe("POST /api/washing/fill", () => {
	it("registers washers and eaters, then refreshes both caches", async () => {
		given();
		expect(await call(fill, base)).toEqual({ success: true });

		const arg = prismaMock.washingRegistration.upsert.mock.calls[0][0];
		expect(arg.create).toMatchObject({ assignedDayId: 5, cookingGroupId: 1, washUserOneId: 1, washUserTwoId: 2 });
		expect(invalidateWashingPoints).toHaveBeenCalledOnce();
		expect(invalidateLongestEater).toHaveBeenCalledOnce();
	});

	it("re-submitting replaces the eaters instead of adding to them", async () => {
		given();
		await call(fill, base);
		expect(prismaMock.washingRegistration.upsert.mock.calls[0][0].update.washingRegistrationEatUsers.deleteMany).toEqual({});
	});

	it("works without eaters (defaults to none)", async () => {
		given();
		await call(fill, { ...base, eaters: undefined });
		expect(prismaMock.washingRegistration.upsert.mock.calls[0][0].create.washingRegistrationEatUsers.create).toEqual([]);
	});

	it("404 for an unknown cooking day, writes nothing", async () => {
		given();
		prismaMock.assignedDay.findUnique.mockResolvedValue(null);
		await expect(call(fill, base)).rejects.toMatchObject({ statusCode: 404 });
		expect(prismaMock.washingRegistration.upsert).not.toHaveBeenCalled();
	});

	it("400 when a washer is inactive", async () => {
		given([1, 3]);
		await expect(call(fill, base)).rejects.toMatchObject({ statusCode: 400 });
		expect(prismaMock.washingRegistration.upsert).not.toHaveBeenCalled();
	});

	it("400 when an eater belongs to another cooking group", async () => {
		given([1, 2, 3, 4]);
		await expect(call(fill, { ...base, eaters: [{ userId: 4, amountEat: 1 }] })).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("a washer may come from another group", async () => {
		given([1, 2, 4]);
		await expect(call(fill, { ...base, washUserTwoId: 4, eaters: [] })).resolves.toEqual({ success: true });
	});

	it("allows the same person as both washers (current behaviour)", async () => {
		given();
		await expect(call(fill, { ...base, washUserTwoId: 1 })).resolves.toEqual({ success: true });
	});

	it("rejects duplicate eaters", async () => {
		given();
		const eaters = [{ userId: 3, amountEat: 1 }, { userId: 3, amountEat: 2 }];
		await expect(call(fill, { ...base, eaters })).rejects.toMatchObject({ statusCode: 400 });
	});

	it.each([0, -1, 1.5])("rejects amountEat %s", async amountEat => {
		given();
		await expect(call(fill, { ...base, eaters: [{ userId: 3, amountEat }] })).rejects.toMatchObject({ statusCode: 400 });
	});

	it("rejects missing washers", async () => {
		given();
		await expect(call(fill, { assignedDayId: 5, washUserOneId: 1 })).rejects.toMatchObject({ statusCode: 400 });
	});

	describe("people who went inactive or moved group after the meal was registered", () => {
		const existing = {
			washUserOneId: 1,
			washUserTwoId: 2,
			washingRegistrationEatUsers: [{ userId: 3 }, { userId: 4 }],
		};

		it("re-saving the same registration works although a washer and an eater are no longer valid", async () => {
			given([1, 3]); // 2 inactive, 4 moved to group 2
			prismaMock.washingRegistration.findUnique.mockResolvedValue(existing);

			await expect(call(fill, { ...base, eaters: [{ userId: 3, amountEat: 1 }, { userId: 4, amountEat: 2 }] }))
				.resolves.toEqual({ success: true });
		});

		it("new people still have to be active/in the group", async () => {
			given([1, 3]);
			prismaMock.washingRegistration.findUnique.mockResolvedValue(existing);

			await expect(call(fill, { ...base, washUserTwoId: 8 })).rejects.toMatchObject({ statusCode: 400 });
			await expect(call(fill, { ...base, eaters: [{ userId: 4, amountEat: 1 }, { userId: 7, amountEat: 1 }] }))
				.rejects.toMatchObject({ statusCode: 400 });
		});

		it("an earlier eater is not grandfathered as a washer", async () => {
			given([1, 2]); // 3 (existing eater) inactive
			prismaMock.washingRegistration.findUnique.mockResolvedValue(existing);

			await expect(call(fill, { ...base, washUserTwoId: 3, eaters: [] })).rejects.toMatchObject({ statusCode: 400 });
		});

		it("a first registration gets no grandfathering", async () => {
			given([1, 2]);
			prismaMock.washingRegistration.findUnique.mockResolvedValue(null);

			await expect(call(fill, base)).rejects.toMatchObject({ statusCode: 400 }); // 3 inactive
		});
	});
});

describe("POST /api/washing/registrations/delete", () => {
	it("removes eaters before the registration and refreshes caches", async () => {
		prismaMock.washingRegistration.findUnique.mockResolvedValue({ id: 7 });
		await call(del, { registrationId: 7 });

		expect(prismaMock.washingRegistrationEatUser.deleteMany).toHaveBeenCalledWith({ where: { washingRegistrationId: 7 } });
		expect(prismaMock.washingRegistration.delete).toHaveBeenCalledWith({ where: { id: 7 } });
		expect(invalidateWashingPoints).toHaveBeenCalled();
		expect(invalidateLongestEater).toHaveBeenCalled();
	});

	it("404 for an unknown registration", async () => {
		prismaMock.washingRegistration.findUnique.mockResolvedValue(null);
		await expect(call(del, { registrationId: 7 })).rejects.toMatchObject({ statusCode: 404 });
		expect(prismaMock.washingRegistration.delete).not.toHaveBeenCalled();
	});
});

describe("POST /api/washing/penalty", () => {
	const user = () => prismaMock.user.findUnique.mockResolvedValue({ id: 1 });

	it("creates a penalty and trims the reason", async () => {
		user();
		await call(penalty, { userId: 1, amount: 2, reason: "  vergeten af te wassen " });
		expect(prismaMock.washingPenalty.create).toHaveBeenCalledWith({
			data: { userId: 1, amount: 2, reason: "vergeten af te wassen" },
		});
		expect(invalidateWashingPoints).toHaveBeenCalled();
	});

	it("accepts a negative amount as a correction", async () => {
		user();
		await expect(call(penalty, { userId: 1, amount: -2, reason: "foutje" })).resolves.toEqual({ success: true });
	});

	it("rejects amount 0 and blank reasons", async () => {
		user();
		await expect(call(penalty, { userId: 1, amount: 0, reason: "x" })).rejects.toMatchObject({ statusCode: 400 });
		await expect(call(penalty, { userId: 1, amount: 1, reason: "   " })).rejects.toMatchObject({ statusCode: 400 });
	});

	it("404 for an unknown user", async () => {
		prismaMock.user.findUnique.mockResolvedValue(null);
		await expect(call(penalty, { userId: 9, amount: 1, reason: "x" })).rejects.toMatchObject({ statusCode: 404 });
	});
});
