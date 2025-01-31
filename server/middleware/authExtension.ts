import { PrismaClient, User } from "@prisma/client";

let client: PrismaClient;

export default defineEventHandler((event) => {
  if (!client) {
    client = new PrismaClient();
  }

  event.context.auth = {
    prisma: client,
  };
});