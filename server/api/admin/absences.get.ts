import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";

const handler = async () => {
  const [users, absences] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.absence.findMany({
      orderBy: [{ start: "desc" }, { id: "desc" }],
      select: {
        id: true,
        userId: true,
        start: true,
        end: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  return { users, absences };
};

export default defineEventHandler((event) =>
  new BaseEventHandler(event, handler).handle({
    route: "/api/admin/absences",
    method: "GET",
    allowType: "ROLE",
    role: ["ADMIN"],
  })
);
