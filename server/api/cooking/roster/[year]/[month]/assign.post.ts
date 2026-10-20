import prisma from "@@/lib/prisma";
import { AllowType, type SessionEvent } from "~/types";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
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
		if (assignment.day > daysInMonth || blockedDays.has(assignment.day)) {
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

		for (const assignment of assignments) {
			const user = usersById.get(assignment.userId);
			if (!user || user.cookingGroupId !== assignment.groupId) {
				throw createError({
					statusCode: 400,
					statusMessage: "Een ingedeelde persoon hoort niet bij de opgegeven kookgroep.",
				});
			}
		}

		if (groupId === undefined) {
			await transaction.assignedDay.deleteMany({
				where: { monthRosterId: monthRoster.id },
			});
		} else {
			const group = await transaction.cookingGroup.findUnique({
				where: { id: groupId },
				select: { id: true },
			});
			if (!group) {
				throw createError({ statusCode: 400, statusMessage: "Kookgroep niet gevonden." });
			}

			await transaction.assignedDay.deleteMany({
				where: {
					monthRosterId: monthRoster.id,
					cookingGroupId: groupId,
				},
			});
		}

		if (assignments.length > 0) {
			await transaction.assignedDay.createMany({
				data: assignments.map(({ day, groupId: assignedGroupId, userId }) => ({
					day,
					userId,
					cookingGroupId: assignedGroupId,
					monthRosterId: monthRoster.id,
				})),
			});
		}

		await transaction.monthRoster.update({
			where: { id: monthRoster.id },
			data: { status: "ASSIGNED" },
		});
	});

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
