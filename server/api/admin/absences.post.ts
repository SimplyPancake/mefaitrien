import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";
import { number, object, string } from "yup";

const isDateOnly = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const dateSchema = () =>
  string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Gebruik een geldige datum.")
    .test("valid-date", "Gebruik een geldige datum.", (value) => !value || isDateOnly(value));

const schema = object({
  userId: number().integer().positive().required(),
  start: dateSchema().required(),
  end: dateSchema().nullable().optional(),
}).test(
  "end-after-start",
  "De einddatum moet op of na de begindatum liggen.",
  ({ start, end }) => !start || !end || end >= start
);

const handler = async (event: SessionEvent) => {
  const { userId, start, end } = event.data;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Gebruiker niet gevonden." });
  }

  return prisma.absence.create({
    data: {
      userId,
      start: new Date(`${start}T00:00:00.000Z`),
      end: end ? new Date(`${end}T00:00:00.000Z`) : null,
    },
    select: { id: true },
  });
};

export default defineEventHandler((event) =>
  new BaseEventHandler(event, handler, schema).handle({
    route: "/api/admin/absences",
    method: "POST",
    allowType: "ROLE",
    role: ["ADMIN"],
  })
);
