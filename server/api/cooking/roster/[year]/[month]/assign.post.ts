import prisma from "@@/lib/prisma";
import { AllowType, type SessionEvent } from "~/types";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { invalidateCookingPoints } from "~/server/utils/cookingPoints";
import { array, number, object } from "yup";

const assignmentSchema = object({
	groupId: number().integer().positive().required(),
	userId: number().integer().positive().required(),
	day: number().integer().min(1).max(31).required(),
});

const bodySchema = object({
	groupId: number().integer().positive().optional(),
	assignments: array().of(assignmentSchema).required(),
});

const handlerFunc = async (event: SessionEvent) => {
	const paramsSchema = object({
		year: number().integer().min(1).required(),
		month: number().integer().min(1).max(12).required(),
	});

	let params;
	try {
		params = await paramsSchema.validate(getRouterParams(event));
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : "Invalid roster month";
		throw createError({ statusCode: 400, statusMessage: message });
	}

	const { groupId, assignments } = event.data as {
		groupId?: number;
		assignments: Array<{ groupId: number; userId: number; day: number }>;
	};
	const monthRoster = await prisma.monthRoster.findUnique({
		where: { year_month: { year: params.year, month: params.month } },
		select: {
			id: true,
			year: true,
			month: true,
			blockedDates: { select: { day: true } },
		},
	});

	if (!monthRoster) {
		throw createError({ statusCode: 404, statusMessage: "Kon geen maandrooster vinden." });
	}

	const daysInMonth = new Date(monthRoster.year, monthRoster.month, 0).getDate();
	const blockedDays = new Set(monthRoster.blockedDates.map(({ day }) => day));
	const assignmentKeys = new Set<string>();
	for (const assignment of assignments) {
		if (assignment.day > daysInMonth) {
			throw createError({
				statusCode: 400,
				statusMessage: `Dag ${assignment.day} kan niet worden ingedeeld.`,
			});
		}
		if (groupId !== undefined && assignment.groupId !== groupId) {
			throw createError({
				statusCode: 400,
				statusMessage: "De indeling bevat een andere kookgroep dan geselecteerd.",
			});
		}

		const key = `${assignment.groupId}:${assignment.day}`;
		if (assignmentKeys.has(key)) {
			throw createError({
				statusCode: 400,
				statusMessage: `Er zijn meerdere koks ingedeeld op dag ${assignment.day} in dezelfde kookgroep.`,
			});
		}
		assignmentKeys.add(key);
	}

	await prisma.$transaction(async (transaction) => {
		const userIds = [...new Set(assignments.map(({ userId }) => userId))];
		const users = await transaction.user.findMany({
			where: { id: { in: userIds } },
			select: { id: true, cookingGroupId: true },
		});
		const usersById = new Map(users.map(user => [user.id, user]));

		if (groupId !== undefined) {
			const group = await transaction.cookingGroup.findUnique({
				where: { id: groupId },
				select: { id: true },
			});
			if (!group) {
				throw createError({ statusCode: 400, statusMessage: "Kookgroep niet gevonden." });
			}
		}

		// Sync instead of delete-all: washing registrations reference assigned days.
		const existing = await transaction.assignedDay.findMany({
			where: {
				monthRosterId: monthRoster.id,
				...(groupId !== undefined && { cookingGroupId: groupId }),
			},
			select: {
				id: true,
				day: true,
				cookingGroupId: true,
				userId: true,
				washingRegistration: { select: { id: true } },
			},
		});
		const existingByKey = new Map(existing.map(row => [`${row.cookingGroupId}:${row.day}`, row]));

		// Unchanged days stay valid when the cook has since moved to another group,
		// otherwise such a month could never be saved again.
		for (const assignment of assignments) {
			const user = usersById.get(assignment.userId);
			const unchanged = existingByKey.get(`${assignment.groupId}:${assignment.day}`)?.userId === assignment.userId;
			if (blockedDays.has(assignment.day) && !unchanged) {
				throw createError({
					statusCode: 400,
					statusMessage: `Dag ${assignment.day} kan niet worden ingedeeld.`,
				});
			}
			if (!unchanged && (!user || user.cookingGroupId !== assignment.groupId)) {
				throw createError({
					statusCode: 400,
					statusMessage: "Een ingedeelde persoon hoort niet bij de opgegeven kookgroep.",
				});
			}
		}

		const toDelete = existing.filter(row => !assignmentKeys.has(`${row.cookingGroupId}:${row.day}`));
		const locked = toDelete.find(row => row.washingRegistration);
		if (locked) {
			throw createError({
				statusCode: 409,
				statusMessage: `Dag ${locked.day} heeft al een afwasregistratie en kan niet worden verwijderd.`,
			});
		}
		if (toDelete.length > 0) {
			await transaction.assignedDay.deleteMany({ where: { id: { in: toDelete.map(({ id }) => id) } } });
		}

		const toCreate = [];
		for (const { day, groupId: assignedGroupId, userId } of assignments) {
			const current = existingByKey.get(`${assignedGroupId}:${day}`);
			if (!current) {
				toCreate.push({ day, userId, cookingGroupId: assignedGroupId, monthRosterId: monthRoster.id });
			} else if (current.userId !== userId) {
				await transaction.assignedDay.update({ where: { id: current.id }, data: { userId } });
			}
		}
		if (toCreate.length > 0) {
			await transaction.assignedDay.createMany({ data: toCreate });
		}

		await transaction.monthRoster.update({
			where: { id: monthRoster.id },
			data: { status: "ASSIGNED" },
		});
	});
	await invalidateCookingPoints();

	return { success: true };
};

export default defineEventHandler(async (event) => {
	return new BaseEventHandler(event, handlerFunc, bodySchema).handle({
		route: "/api/cooking/roster/*/*/assign",
		method: "POST",
		allowType: AllowType.ROLE,
		role: ["ADMIN", "COOKING"],
	});
});
