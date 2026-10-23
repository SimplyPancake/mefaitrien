import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";

import prisma from "../../../lib/prisma";
import { generateToken, verifyPassword } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { username, password } = await readBody(event);

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Gebruikersnaam of wachtwoord is onjuist.",
    });
  }

  if (!user.isActive) {
    throw createError({ statusCode: 403, statusMessage: "Dit account is inactief" });
  }

  // Check if the password is correct
  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: "Gebruikersnaam of wachtwoord is onjuist.",
    });
  }

  // Create a JWT token
  const token = generateToken(user.id, config.jwtSecret);

  // set the token to the db for the sessionId (refresh token)
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: token },
  });

  const responseBody = {
    token: {
      bearer: token,
    },
    timestamp: new Date().toISOString(),
  };

  let ret = new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return ret;
});
