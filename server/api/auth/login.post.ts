import { generateToken, verifyPassword } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { username, password } = await readBody(event);

  const prisma = event.context.auth.prisma;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Check if the password is correct
  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    return new Response("Invalid password", { status: 400 });
  }

  // Create a JWT token
  const token = generateToken(user.id, config.jwtSecret);

  // set the token to the db for the sessionId (refresh token)
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: token },
  });

  return new Response(token, {
    status: 200,
  });
});
