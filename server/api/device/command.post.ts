import { AllowType, SessionEvent } from "~/types";
import { parseCommand, type CommandResult } from "~~/types/device";

let handlerFunc = async (event: SessionEvent): Promise<CommandResult> => {
  const cmd = parseCommand(await readBody<unknown>(event));
  if (!cmd) throw createError({ statusCode: 400, statusMessage: "Invalid command" });
  return await executeCommand(cmd);
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/device/command",
    method: "POST",
    allowType: AllowType.ROLE,
    role: ["ADMIN"],
  });
});