import { number, object } from "yup";
import type { ServerFile } from "#file-storage/types";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { profileImageFileSchema, saveProfileImage } from "~/server/utils/profileImage";
import type { SessionEvent } from "~/types";

const handlerFunc = async (event: SessionEvent) => {
	const { userId, file } = event.data as { userId: number; file: ServerFile };
	await saveProfileImage(userId, file);
	return { avatarUrl: `/api/account/avatar?userId=${userId}` };
};

export default defineEventHandler((event) =>
	new BaseEventHandler(
		event,
		handlerFunc,
		object({
			userId: number().integer().positive().required(),
			file: profileImageFileSchema,
		}),
	).handle({
		route: "/api/admin/user-avatar",
		method: "POST",
		allowType: "ROLE",
		role: ["ADMIN"],
	}),
);
