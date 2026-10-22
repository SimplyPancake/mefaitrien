import { randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";
import { object, string } from "yup";
import type { ServerFile } from "#file-storage/types";
import prisma from "~/lib/prisma";

const MAX_IMAGE_SIZE = 1024 * 1024;
const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const imageExtensions: Record<string, string> = {
	"image/jpeg": "jpeg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
};

export const profileImageFileSchema = object({
	name: string().required(),
	type: string().oneOf(imageTypes).required(),
	size: string().required().test(
		"max-size",
		"De afbeelding mag maximaal 1 MB zijn.",
		(size) => Number(size) > 0 && Number(size) <= MAX_IMAGE_SIZE,
	),
	lastModified: string().required(),
	content: string().required(),
});

export const saveProfileImage = async (userId: number, file: ServerFile) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { profileImage: true },
	});
	if (!user) {
		throw createError({ statusCode: 404, statusMessage: "Gebruiker niet gevonden." });
	}

	const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(file.content);
	if (!match || match[1] !== file.type) {
		throw createError({ statusCode: 400, statusMessage: "Upload een geldige afbeeldingsfile." });
	}

	const bytes = Buffer.from(match[2] ?? "", "base64");
	if (bytes.length > MAX_IMAGE_SIZE || bytes.length !== Number(file.size)) {
		throw createError({ statusCode: 400, statusMessage: "De afbeelding mag maximaal 1 MB zijn." });
	}
	if (!hasImageSignature(file.type, bytes)) {
		throw createError({ statusCode: 400, statusMessage: "Upload een geldige afbeeldingsfile." });
	}

	const filename = await storeFileLocally(
		{ ...file, name: `profile.${imageExtensions[file.type]}` },
		`avatar-${userId}-${randomBytes(12).toString("hex")}`,
		"/profile-images",
	);
	await prisma.user.update({
		where: { id: userId },
		data: { profileImage: filename },
	});

	if (user.profileImage) {
		await rm(getFileLocally(user.profileImage, "/profile-images"), { force: true });
	}
};

const hasImageSignature = (type: string, bytes: Buffer) =>
	(type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
	|| (type === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
	|| (type === "image/webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP")
	|| (type === "image/gif" && /^GIF8[79]a/.test(bytes.toString("ascii", 0, 6)));
