import { AllowType, SessionEvent } from "~/types";
import { parseCommand } from "~~/types/device";

let handlerFunc = async (event: SessionEvent): Promise<{ ok: boolean; error?: string }> => {
  const body = await readBody<{ preset?: unknown }>(event);
  // the type is fixed here, so this route can never run any other command
  const cmd = parseCommand({ type: "set_preset", preset: body?.preset });
  if (!cmd) throw createError({ statusCode: 400, statusMessage: "Invalid preset" });

  const res = await executeCommand(cmd);
  // device error details are admin-only (they appear in the events log)
  return res.ok ? { ok: true } : { ok: false, error: "Could not apply preset" };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/device/preset",
    method: "POST",
    allowType: AllowType.AUTHENTICATED,
  });
});