import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";

let handlerFunc = async (event: H3Event) => {
  console.log("Hey!");
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle();
});
