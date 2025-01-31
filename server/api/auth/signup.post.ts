import { generateToken, hashPassword } from "~/server/utils/auth";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";





export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { username, password } = await readBody(event);

  const prisma = event.context.auth.prisma;

  // Check if the username already exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return new Response("Username already taken", { status: 400 });
  }

  // Hash the password
  const hashedPassword = await hashPassword(password);

  // Store the new user in the database
  const newUser = await prisma.user.create({
    data: {
      username,
      passwordHash: hashedPassword,
    },
  });

  // Generate a JWT for the new user
  const token = generateToken(newUser.id, config.jwtSecret);

  return new Response(token, {
    status: 200,
  });
});