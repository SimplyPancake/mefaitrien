import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";
import { number, object } from "yup";

const schema = object({
  id: number().integer().positive().required(),
});

const handler = async (event: SessionEvent) => {
  const { id } = event.data;
  const result = await prisma.absence.deleteMany({ where: { id } });

  if (result.count === 0) {
    throw createError({ statusCode: 404, statusMessage: "Afwezigheid niet gevonden." });
  }

  return { success: true };
};

export default defineEventHandler((event) =>
  new BaseEventHandler(event, handler, schema).handle({
    route: "/api/admin/absences/delete",
    method: "POST",
    allowType: "ROLE",
    role: ["ADMIN"],
  })
);
