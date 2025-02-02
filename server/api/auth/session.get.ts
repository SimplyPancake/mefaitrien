import prisma from "../../../lib/prisma";
import { getSessionData, verifyToken } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const { valid, id } = verifyToken(event);

  if (!valid || !id) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  let userData = await getSessionData(id);

  return new Response(JSON.stringify(userData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
