import { describe, expect, it, vi } from "vitest";
import { prismaMock } from "../helpers/prisma";

const invalidateWashingPoints = vi.hoisted(() => vi.fn());
vi.mock("~/server/utils/washingPoints", () => ({ invalidateWashingPoints }));

const { default: editUser } = await import("~/server/api/admin/user.post");

type Existing = { isActive: boolean; cookingGroupId: number | null; roles?: string[] };

// Group 1 peers: totals 10 and 6 (base 0/2 + 10/4 assigned days) => average 8
const given = (existing: Existing, ownAssigned = 3) => {
	prismaMock.user.findUnique.mockResolvedValue({
		id: 1,
		isActive: existing.isActive,
		cookingGroupId: existing.cookingGroupId,
		roles: (existing.roles ?? ["USER"]).map(role => ({ role })),
	});
	prismaMock.user.findMany.mockResolvedValue([
		{ id: 10, cookingpointsBase: 0 },
		{ id: 11, cookingpointsBase: 2 },
	]);
	prismaMock.assignedDay.groupBy.mockResolvedValue([
		{ userId: 10, _count: { _all: 10 } },
		{ userId: 11, _count: { _all: 4 } },
	]);
	prismaMock.assignedDay.count.mockResolvedValue(ownAssigned);
	prismaMock.user.update.mockImplementation(async ({ data }: any) => data);
};

const edit = (patch: Record<string, unknown>) =>
	(editUser as any)({
		body: {
			id: 1,
			name: "Jan",
			email: "jan@example.com",
			username: "jan",
			roles: ["USER"],
			cookingGroupId: 1,
			isActive: true,
			...patch,
		},
	});

const updateData = () => prismaMock.user.update.mock.calls[0][0].data;

describe("editing a housemate (admin/user)", () => {
	it("reactivating starts at the group's average minus the assignments they already have", async () => {
		given({ isActive: false, cookingGroupId: 1 });
		await edit({});
		expect(updateData().cookingpointsBase).toBe(5); // 8 - 3
		expect(invalidateWashingPoints).toHaveBeenCalled();
	});

	it("reactivating into a different group uses the new group's peers", async () => {
		given({ isActive: false, cookingGroupId: 2 });
		await edit({ cookingGroupId: 1 });
		expect(updateData().cookingpointsBase).toBe(5);
		expect(prismaMock.user.findMany.mock.calls[0][0].where).toEqual({ isActive: true, cookingGroupId: 1 });
	});

	it("moving an active user to another group rebases their points like group/assign does", async () => {
		given({ isActive: true, cookingGroupId: 2 });
		await edit({ cookingGroupId: 1 });
		expect(updateData().cookingpointsBase).toBe(5);
		expect(updateData().cookingGroupId).toBe(1);
		expect(invalidateWashingPoints).not.toHaveBeenCalled(); // washing points do not depend on the group
	});

	it("removing a user from their group keeps their points", async () => {
		given({ isActive: true, cookingGroupId: 2 });
		await edit({ cookingGroupId: null });
		expect(updateData()).not.toHaveProperty("cookingpointsBase");
	});

	it("an unchanged group leaves points alone", async () => {
		given({ isActive: true, cookingGroupId: 1 });
		await edit({ name: "Janneke" });
		expect(updateData()).not.toHaveProperty("cookingpointsBase");
	});

	it("moving an inactive user does not rebase; that happens on reactivation", async () => {
		given({ isActive: false, cookingGroupId: 2 });
		await edit({ cookingGroupId: 1, isActive: false });
		expect(updateData()).not.toHaveProperty("cookingpointsBase");
	});

	it("deactivating keeps points and assignments but refreshes washing points", async () => {
		given({ isActive: true, cookingGroupId: 1 });
		await edit({ isActive: false });
		expect(updateData()).toMatchObject({ isActive: false });
		expect(updateData()).not.toHaveProperty("cookingpointsBase");
		expect(prismaMock.assignedDay.deleteMany).not.toHaveBeenCalled();
		expect(invalidateWashingPoints).toHaveBeenCalledOnce();
	});

	it("reactivating into an empty group: base = minus own assignments", async () => {
		given({ isActive: false, cookingGroupId: 1 });
		prismaMock.user.findMany.mockResolvedValue([]);
		await edit({});
		expect(updateData().cookingpointsBase).toBe(-3);
	});

	it("refuses to deactivate the last active admin", async () => {
		given({ isActive: true, cookingGroupId: 1, roles: ["ADMIN"] });
		prismaMock.user.count.mockResolvedValue(0);
		await expect(edit({ isActive: false, roles: ["ADMIN"] })).rejects.toMatchObject({ statusCode: 403 });
		expect(prismaMock.user.update).not.toHaveBeenCalled();
	});

	it("allows deactivating an admin when another active admin remains", async () => {
		given({ isActive: true, cookingGroupId: 1, roles: ["ADMIN"] });
		prismaMock.user.count.mockResolvedValue(1);
		await expect(edit({ isActive: false, roles: ["ADMIN"] })).resolves.toBeDefined();
	});
});
