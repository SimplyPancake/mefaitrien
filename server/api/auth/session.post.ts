import { verifyToken } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const { valid, id } = verifyToken(event);

  if (!valid) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(JSON.stringify({ userId: id, sessionActive: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
