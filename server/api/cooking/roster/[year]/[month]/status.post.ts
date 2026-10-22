import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { AllowType, type SessionEvent } from "~/types";
import { number, object, string } from "yup";

const bodySchema = object({
	status: string().oneOf(["CANFILLIN", "NOFILLIN", "ASSIGNED"]).required(),
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

	const monthRoster = await prisma.monthRoster.findUnique({
		where: { year_month: { year: params.year, month: params.month } },
		select: { id: true },
	});
	if (!monthRoster) {
		throw createError({ statusCode: 404, statusMessage: "Kon geen maandrooster vinden." });
	}

	const { status } = event.data as { status: "CANFILLIN" | "NOFILLIN" | "ASSIGNED" };
	await prisma.monthRoster.update({
		where: { id: monthRoster.id },
		data: { status },
	});

	return { success: true };
};

export default defineEventHandler(async (event) => {
	return new BaseEventHandler(event, handlerFunc, bodySchema).handle({
		route: "/api/cooking/roster/*/*/status",
		method: "POST",
		allowType: AllowType.ROLE,
		role: ["ADMIN", "COOKING"],
	});
});
