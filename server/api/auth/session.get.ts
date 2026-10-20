import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";

const handlerFunc = async (event: SessionEvent) => {
  return new Response(JSON.stringify(event.session), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/auth/session",
    method: "GET",
    allowType: "AUTHENTICATED",
  });
});
