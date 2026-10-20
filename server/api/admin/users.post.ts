import prisma from "@@/lib/prisma";
import { Role } from "@@/generated/prisma/client";
import { hashPassword } from "~/server/utils/auth";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";
import { number, object, string } from "yup";

const schema = object({
	name: string().trim().required("Name is required"),
	username: string().trim().required("Username is required"),
	email: string().trim().email("Invalid email address").lowercase().required("Email is required"),
	password: string().min(8, "Password must be at least 8 characters").required("Password is required"),
	cookingGroupId: number().integer().positive().nullable().optional(),
});

const handler = async (event: SessionEvent) => {
	const { name, username, email, password, cookingGroupId } = event.data;

	try {
		if (cookingGroupId != null) {
			const cookingGroup = await prisma.cookingGroup.findUnique({
				where: { id: cookingGroupId },
				select: { id: true },
			});

			if (!cookingGroup) {
				throw createError({ statusCode: 400, statusMessage: "Cooking group does not exist" });
			}
		}

		return await prisma.user.create({
			data: {
				name,
				username,
				email,
				passwordHash: await hashPassword(password),
				cookingGroupId,
				roles: {
					create: [{ role: Role.USER }],
				},
			},
			select: {
				id: true,
				name: true,
				username: true,
				email: true,
				roles: {
					select: { role: true },
				},
			},
		});
	} catch (error) {
		if (
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			error.code === "P2002"
		) {
			throw createError({ statusCode: 409, statusMessage: "Username or email already exists" });
		}

		throw error;
	}
};

export default defineEventHandler((event) =>
	new BaseEventHandler(event, handler, schema).handle({
		route: "/api/admin/users",
		method: "POST",
		allowType: "ROLE",
		role: ["ADMIN"],
	})
);
