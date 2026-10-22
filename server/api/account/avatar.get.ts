import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import prisma from "~/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";

const contentTypes: Record<string, string> = {
  gif: "image/gif",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const handlerFunc = async (event: SessionEvent) => {
  const requestedUserId = getQuery(event).userId;
  const userId = requestedUserId === undefined ? event.session.id : Number(requestedUserId);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw createError({ statusCode: 400, statusMessage: "Ongeldige gebruikers-ID." });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileImage: true, isActive: true },
  });

  const extension = user!.profileImage!.split(".").at(-1);
  const contentType = extension ? contentTypes[extension] : undefined;
  if (!contentType || !/^avatar-\d+-[a-f0-9]{24}\.(?:gif|jpeg|png|webp)$/.test(user!.profileImage!)) {
    throw createError({ statusCode: 500, statusMessage: "De opgeslagen profielfoto is ongeldig." });
  }

  const fileStorage = useRuntimeConfig(event).public.fileStorage;
  if (
    typeof fileStorage !== "object"
    || fileStorage === null
    || !("mount" in fileStorage)
    || typeof fileStorage.mount !== "string"
    || !fileStorage.mount
  ) {
    throw createError({ statusCode: 500, statusMessage: "De opslaglocatie voor bestanden is niet ingesteld." });
  }

  const mount = fileStorage.mount;
  const image = await readFile(resolve(mount, "profile-images", user.profileImage));
  setResponseHeader(event, "Content-Type", contentType);
  setResponseHeader(event, "Cache-Control", "private, no-store");
  return image;
};

export default defineEventHandler((event) =>
  new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/account/avatar",
    method: "GET",
    allowType: "AUTHENTICATED",
  }),
);
