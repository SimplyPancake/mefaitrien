import { object } from "yup";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";
import type { ServerFile } from "#file-storage/types";
import { profileImageFileSchema, saveProfileImage } from "~/server/utils/profileImage";

const handlerFunc = async (event: SessionEvent) => {
  const userId = event.session.id;
  const file = event.data.file as ServerFile;
  await saveProfileImage(userId, file);

  return { avatarUrl: "/api/account/avatar" };
};

export default defineEventHandler((event) =>
  new BaseEventHandler(event, handlerFunc, object({ file: profileImageFileSchema })).handle({
    route: "/api/account/avatar",
    method: "POST",
    allowType: "AUTHENTICATED",
  }),
);
