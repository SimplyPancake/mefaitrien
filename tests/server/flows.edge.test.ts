import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../helpers/prisma";
import { redis } from "../helpers/nitro";

const migrateUserCookingGroup = vi.hoisted(() => vi.fn());
const invalidateWashingPoints = vi.hoisted(() => vi.fn());
vi.mock("~/server/utils/functions", () => ({ migrateUserCookingGroup }));
vi.mock("~/server/utils/washingPoints", () => ({
	invalidateWashingPoints,
	getWashingPointTotals: async (users: { id: number }[]) =>
		new Map(users.map(u => [u.id, { totalPoints: 1 }])),
}));

const { default: availability } = await import("~/server/api/cooking/availability.post");
const { default: status } = await import("~/server/api/cooking/roster/[year]/[month]/status.post");
const { default: groupAssign } = await import("~/server/api/cooking/group/assign.post");
const { default: cookingBase } = await import("~/server/api/cooking/points/update.post");
const { default: washingBase } = await import("~/server/api/washing/points/base.post");
const { default: penaltyDelete } = await import("~/server/api/washing/penalty/delete.post");
const { default: fillGet } = await import("~/server/api/washing/fill.get");

const call = (handler: any, event: any) => handler(event);

describe("POST /api/cooking/availability", () => {
	const post = (body: any, userId = 7) => call(availability, { body, session: { id: userId } });

	it("replaces only this user's rows for a CANFILLIN month (month is 1-12)", async () => {
		prismaMock.monthRoster.findFirst.mockResolvedValue({ id: 3 });
		prismaMock.availability.createMany.mockResolvedValue({ count: 1 });

		await post({
			year: 2026,
			month: 11,
			dates: [
				{ date: "2026-11-05", availability: "NEGATIVE" },
				{ date: "2026-12-01", availability: "UNAVAILABLE" }, // other month, dropped
			],
		});

		expect(prismaMock.monthRoster.findFirst).toHaveBeenCalledWith({
			where: { year: 2026, month: 11, status: "CANFILLIN" },
		});
		expect(prismaMock.availability.deleteMany).toHaveBeenCalledWith({ where: { userId: 7, monthRosterId: 3 } });
		expect(prismaMock.availability.createMany.mock.calls[0][0].data).toEqual([
			{ userId: 7, monthRosterId: 3, day: 5, availability: "NEGATIVE" },
		]);
	});

	it("an empty list clears the month and writes nothing", async () => {
		prismaMock.monthRoster.findFirst.mockResolvedValue({ id: 3 });
		await expect(post({ year: 2026, month: 11, dates: [] })).resolves.toEqual({ count: 0 });
		expect(prismaMock.availability.deleteMany).toHaveBeenCalled();
		expect(prismaMock.availability.createMany).not.toHaveBeenCalled();
	});

	it("404 when the month is closed or missing, and writes nothing", async () => {
		prismaMock.monthRoster.findFirst.mockResolvedValue(null);
		await expect(post({ year: 2026, month: 11, dates: [] })).rejects.toMatchObject({
			status: 404,
			statusMessage: "Kon geen toegestane maand vinden",
		});
		expect(prismaMock.availability.deleteMany).not.toHaveBeenCalled();
	});

	it("400 when every date is outside the month, or the calendar date is impossible", async () => {
		await expect(
			post({ year: 2026, month: 11, dates: [{ date: "2026-12-01", availability: "POSITIVE" }] }),
		).rejects.toMatchObject({ statusMessage: "No valid dates provided for the specified month and year" });
		await expect(
			post({ year: 2025, month: 2, dates: [{ date: "2025-02-29", availability: "AVAILABLE" }] }),
		).rejects.toMatchObject({ status: 400 });
		expect(prismaMock.monthRoster.findFirst).not.toHaveBeenCalled();
	});

	it("accepts 29 Feb on a leap year", async () => {
		prismaMock.monthRoster.findFirst.mockResolvedValue({ id: 1 });
		prismaMock.availability.createMany.mockResolvedValue({ count: 1 });
		await post({ year: 2024, month: 2, dates: [{ date: "2024-02-29", availability: "AVAILABLE" }] });
		expect(prismaMock.availability.createMany.mock.calls[0][0].data).toEqual([
			{ userId: 7, monthRosterId: 1, day: 29, availability: "AVAILABLE" },
		]);
	});

	it("rejects a duplicate day and a 0-based month", async () => {
		await expect(
			post({
				year: 2026,
				month: 11,
				dates: [
					{ date: "2026-11-05", availability: "NEGATIVE" },
					{ date: "2026-11-05", availability: "POSITIVE" },
				],
			}),
		).rejects.toMatchObject({ status: 400, statusMessage: "Een dag komt meerdere keren voor." });
		await expect(post({ year: 2026, month: 0, dates: [] })).rejects.toMatchObject({ status: 400 });
		expect(prismaMock.monthRoster.findFirst).not.toHaveBeenCalled();
		expect(prismaMock.availability.deleteMany).not.toHaveBeenCalled();
	});
});

describe("POST /api/cooking/roster/:y/:m/status", () => {
	const post = (month: string, statusValue: string) =>
		call(status, { params: { year: "2026", month }, body: { status: statusValue } });

	it("sets any status and does not touch assignments", async () => {
		prismaMock.monthRoster.findUnique.mockResolvedValue({ id: 4 });
		await expect(post("11", "CANFILLIN")).resolves.toEqual({ success: true });
		expect(prismaMock.monthRoster.update).toHaveBeenCalledWith({ where: { id: 4 }, data: { status: "CANFILLIN" } });
		expect(prismaMock.assignedDay.deleteMany).not.toHaveBeenCalled();
	});

	it("404 for a missing roster, 400 for a bad status or month", async () => {
		prismaMock.monthRoster.findUnique.mockResolvedValue(null);
		await expect(post("11", "ASSIGNED")).rejects.toMatchObject({ statusCode: 404 });
		await expect(post("11", "DONE")).rejects.toMatchObject({ statusCode: 400 });
		await expect(post("13", "ASSIGNED")).rejects.toMatchObject({ statusCode: 400 });
		expect(prismaMock.monthRoster.update).not.toHaveBeenCalled();
	});
});

describe("POST /api/cooking/group/assign", () => {
	const post = (cookingGroupId: number | null) => call(groupAssign, { body: { userId: 1, cookingGroupId } });

	it("rebases then stores the new group", async () => {
		prismaMock.user.findUnique.mockResolvedValue({ id: 1, cookingGroupId: 2 });
		prismaMock.cookingGroup.findUnique.mockResolvedValue({ id: 5 });
		await post(5);
		expect(migrateUserCookingGroup).toHaveBeenCalledWith(1, 5);
		expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { cookingGroupId: 5 } });
	});

	it("leaving a group stores null; rebase is asked but ignores null", async () => {
		prismaMock.user.findUnique.mockResolvedValue({ id: 1, cookingGroupId: 2 });
		await post(null);
		expect(migrateUserCookingGroup).toHaveBeenCalledWith(1, null);
		expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { cookingGroupId: null } });
	});

	it("same group is a no-op", async () => {
		prismaMock.user.findUnique.mockResolvedValue({ id: 1, cookingGroupId: 2 });
		prismaMock.cookingGroup.findUnique.mockResolvedValue({ id: 2 });
		await post(2);
		expect(migrateUserCookingGroup).not.toHaveBeenCalled();
		expect(prismaMock.user.update).not.toHaveBeenCalled();
	});

	it("404 unknown user, 400 unknown group, nothing written", async () => {
		prismaMock.user.findUnique.mockResolvedValue(null);
		await expect(post(2)).rejects.toMatchObject({ statusCode: 404 });
		prismaMock.user.findUnique.mockResolvedValue({ id: 1, cookingGroupId: 2 });
		prismaMock.cookingGroup.findUnique.mockResolvedValue(null);
		await expect(post(9)).rejects.toMatchObject({ statusCode: 400 });
		expect(prismaMock.user.update).not.toHaveBeenCalled();
	});
});

describe("point bases are applied on read, so these endpoints skip the cache", () => {
	it("cooking base", async () => {
		prismaMock.user.findUnique.mockResolvedValue({ id: 1 });
		await call(cookingBase, { body: { userId: 1, basePoints: -3 } });
		expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { cookingpointsBase: -3 } });
		expect(redis.size).toBe(0);
		await expect(call(cookingBase, { body: { userId: 1, basePoints: 1.5 } })).rejects.toMatchObject({ statusCode: 400 });
	});

	it("washing base, 404 unknown user", async () => {
		prismaMock.user.findUnique.mockResolvedValue({ id: 1 });
		await call(washingBase, { body: { userId: 1, basePoints: 4 } });
		expect(invalidateWashingPoints).not.toHaveBeenCalled();
		expect(redis.size).toBe(0);
		prismaMock.user.findUnique.mockResolvedValue(null);
		await expect(call(washingBase, { body: { userId: 9, basePoints: 1 } })).rejects.toMatchObject({ statusCode: 404 });
	});
});

describe("POST /api/washing/penalty/delete", () => {
	it("deletes and refreshes washing points", async () => {
		prismaMock.washingPenalty.findUnique.mockResolvedValue({ id: 3 });
		await expect(call(penaltyDelete, { body: { penaltyId: 3 } })).resolves.toEqual({ success: true });
		expect(prismaMock.washingPenalty.delete).toHaveBeenCalledWith({ where: { id: 3 } });
		expect(invalidateWashingPoints).toHaveBeenCalledOnce();
	});

	it("404 unknown, 400 missing id", async () => {
		prismaMock.washingPenalty.findUnique.mockResolvedValue(null);
		await expect(call(penaltyDelete, { body: { penaltyId: 3 } })).rejects.toMatchObject({ statusCode: 404 });
		await expect(call(penaltyDelete, { body: {} })).rejects.toMatchObject({ statusCode: 400 });
		expect(prismaMock.washingPenalty.delete).not.toHaveBeenCalled();
	});
});

describe("GET /api/washing/fill", () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date(2026, 10, 9)); // 9 Nov 2026
	});
	afterEach(() => vi.useRealTimers());

	const groups = [{ id: 1, name: "A" }, { id: 2, name: "B" }];

	it("hides future days and pages 10", async () => {
		prismaMock.user.findUnique.mockResolvedValue({ cookingGroupId: 1 });
		prismaMock.cookingGroup.findMany.mockResolvedValue(groups);
		prismaMock.cookingGroup.findUnique.mockResolvedValue(groups[0]);
		prismaMock.user.findMany.mockResolvedValue([]);
		prismaMock.assignedDay.findMany.mockResolvedValue(
			Array.from({ length: 11 }, (_, i) => ({
				id: i + 1,
				day: 1,
				user: { id: 1, name: "a" },
				monthRoster: { year: 2026, month: 11 },
				washingRegistration: null,
			})),
		);

		const page = await call(fillGet, { session: { id: 7 }, query: {} });
		const where = prismaMock.assignedDay.findMany.mock.calls[0][0].where;
		expect(where.cookingGroupId).toBe(1);
		expect(JSON.stringify(where)).toContain('"lte":9');
		expect(page.days).toHaveLength(10);
		expect(page).toMatchObject({ hasMore: true, nextCursor: 10 });
		expect(page.days[0].registration).toBeNull();
	});

	it("no group anywhere is an empty page", async () => {
		prismaMock.user.findUnique.mockResolvedValue({ cookingGroupId: null });
		prismaMock.cookingGroup.findMany.mockResolvedValue([]);
		await expect(call(fillGet, { session: { id: 7 }, query: {} })).resolves.toMatchObject({
			group: null,
			days: [],
			hasMore: false,
		});
		expect(prismaMock.assignedDay.findMany).not.toHaveBeenCalled();
	});

	it("falls back to the first group when the member has none", async () => {
		prismaMock.user.findUnique.mockResolvedValue({ cookingGroupId: null });
		prismaMock.cookingGroup.findMany.mockResolvedValue(groups);
		prismaMock.cookingGroup.findUnique.mockResolvedValue(groups[0]);
		prismaMock.user.findMany.mockResolvedValue([]);
		prismaMock.assignedDay.findMany.mockResolvedValue([]);
		await call(fillGet, { session: { id: 7 }, query: {} });
		expect(prismaMock.assignedDay.findMany.mock.calls[0][0].where.cookingGroupId).toBe(1);
	});

	it("400 bad cursor or group, 404 unknown group", async () => {
		prismaMock.user.findUnique.mockResolvedValue({ cookingGroupId: 1 });
		prismaMock.cookingGroup.findMany.mockResolvedValue(groups);
		await expect(call(fillGet, { session: { id: 7 }, query: { after: "0" } })).rejects.toMatchObject({ statusCode: 400 });
		await expect(call(fillGet, { session: { id: 7 }, query: { groupId: "1.5" } })).rejects.toMatchObject({ statusCode: 400 });
		await expect(call(fillGet, { session: { id: 7 }, query: { groupId: "99" } })).rejects.toMatchObject({ statusCode: 404 });
		prismaMock.assignedDay.findFirst.mockResolvedValue(null);
		await expect(call(fillGet, { session: { id: 7 }, query: { after: "3" } })).rejects.toMatchObject({ statusCode: 400 });
	});
});
