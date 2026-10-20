import { generateToken, hashPassword } from "~/server/utils/auth";
import { Role } from "@@/generated/prisma/client";
import prisma from '../../../lib/prisma';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { username, email, password, name } = await readBody(event);

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
      email,
      name,
      roles: {
        create: [{ role: Role.USER }],
      },
    },
  });

  // Generate a JWT for the new user
  const token = generateToken(newUser.id, config.jwtSecret);

  return new Response(token, {
    status: 200,
  });
});