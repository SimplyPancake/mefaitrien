import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";

import prisma from "../../../lib/prisma";

let handlerFunc = async (event: H3Event) => {
  // Return own cooking availability
  console.log("event", event);

  return true;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle();
});
