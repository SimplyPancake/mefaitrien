import { describe, expect, it } from "vitest";
import { prismaMock } from "../helpers/prisma";
import { migrateUserCookingGroup } from "~/server/utils/functions";

// peers: [base, assignedDays] per user id 10, 11, ...
const given = (peers: [base: number, assigned: number][], ownAssigned: number) => {
	prismaMock.user.findMany.mockResolvedValue(peers.map(([cookingpointsBase], i) => ({ id: 10 + i, cookingpointsBase })));
	prismaMock.assignedDay.groupBy.mockResolvedValue(
		peers.map(([, assigned], i) => ({ userId: 10 + i, _count: { _all: assigned } })),
	);
	prismaMock.assignedDay.count.mockResolvedValue(ownAssigned);
};

describe("migrateUserCookingGroup", () => {
	it("sets base so the user's total equals the new group's average", async () => {
		given([[0, 10], [2, 4]], 3); // totals 10 and 6 => average 8
		await migrateUserCookingGroup(1, 5);

		expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { cookingpointsBase: 5 } }); // 8 - 3
	});

	it("does nothing when leaving a group (null)", async () => {
		await migrateUserCookingGroup(1, null);
		expect(prismaMock.user.update).not.toHaveBeenCalled();
	});

	it("into an empty group: average 0, so base = -own assignments", async () => {
		given([], 4);
		await migrateUserCookingGroup(1, 5);
		expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { cookingpointsBase: -4 } });
	});

	it("rounds the average", async () => {
		given([[0, 1], [0, 2]], 0); // average 1.5 => 2
		await migrateUserCookingGroup(1, 5);
		expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { cookingpointsBase: 2 } });
	});
});
