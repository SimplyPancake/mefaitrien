import { deviceHub, pushEvent, sendCommand } from "~/server/utils/deviceHub";
import type { Command, CommandResult } from "~~/types/device";

export async function executeCommand(cmd: Command): Promise<CommandResult> {
  if (cmd.type === "set_preset" && !deviceHub.state?.presets.includes(cmd.preset)) {
    throw createError({ statusCode: 409, statusMessage: "Unknown preset" });
  }
  pushEvent("server", "info", `command: ${cmd.type}`);

  // preset switches and restarts restart CamillaDSP, which can take a while
  const slow = cmd.type === "set_preset" || cmd.type === "restart_camilladsp";
  const res = await sendCommand(cmd, slow ? 30_000 : 10_000);

  if (!res.ok) pushEvent("server", "error", `${cmd.type} failed: ${res.error}`);
  return res;
}