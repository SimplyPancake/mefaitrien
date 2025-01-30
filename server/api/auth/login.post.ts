import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { username, password } = await readBody(event);

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Check if the password is correct
  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    return new Response("Invalid password", { status: 400 });
  }

  // Create a JWT token
  const token = jwt.sign({ id: user.id }, config.jwtSecret);

  // set the token to the db for the sessionId (refresh token)
  await user.refreshToken.

  return new Response(token, {
    status: 200,
  });
});
