
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { createMariaDbAdapter } from "./createMariaDbAdapter";

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter: createMariaDbAdapter() });
};

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
