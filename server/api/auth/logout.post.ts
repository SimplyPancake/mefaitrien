import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";
import prisma from '../../../lib/prisma';

const handlerFunc = async (event: SessionEvent) => {
  // Remove the token from the list of active tokens
  await prisma.user.update({
    where: { id: event.session.id },
    data: { refreshToken: null },
  });

  return new Response("Logged out successfully", { status: 200 });
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/auth/logout",
    method: "POST",
    allowType: "AUTHENTICATED",
  });
});
