import ical, { ICalCalendarMethod } from "ical-generator";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const userId = Number.parseInt(getRouterParam(event, "userId") ?? "", 10);
  const routerParams = getRouterParams(event);
  const token = (routerParams.token ?? routerParams["token.ics"] ?? "").replace(/\.ics$/i, "");

  if (!Number.isSafeInteger(userId) || userId < 1 || !/^[a-f0-9]{64}$/i.test(token)) {
    throw createError({ statusCode: 404, statusMessage: "Calendar not found" });
  }

  const user = await prisma.user.findFirst({
    where: { calendarToken: token, isActive: true },
    select: {
      id: true,
      name: true,
      AssignedDay: {
        orderBy: [{ monthRoster: { year: "asc" } }, { monthRoster: { month: "asc" } }, { day: "asc" }],
        select: {
          id: true,
          day: true,
          cookingGroup: { select: { name: true } },
          monthRoster: { select: { year: true, month: true } },
        },
      },
    },
  });

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Calendar not found" });
  }

  const calendar = ical({
    name: `Kookdiensten - ${user.name}`,
    prodId: "-//Me Fait Rien//Cooking calendar//NL",
    method: ICalCalendarMethod.PUBLISH,
  });

  for (const assignment of user.AssignedDay) {
    const date = new Date(Date.UTC(
      assignment.monthRoster.year,
      assignment.monthRoster.month - 1,
      assignment.day
    ));
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    calendar.createEvent({
      id: `assignment-${assignment.id}-user-${user.id}@mefaitrien`,
      start: date,
      end: nextDate,
      allDay: true,
      summary: `Kookdienst voor ${assignment.cookingGroup.name}`,
      description: `Je kookt voor kookgroep ${assignment.cookingGroup.name}.`,
    });
  }

  setHeader(event, "Content-Type", "text/calendar; charset=utf-8");
  setHeader(event, "Content-Disposition", 'attachment; filename="kookdiensten.ics"');
  setHeader(event, "Cache-Control", "private, no-store");
  return calendar.toString();
});
