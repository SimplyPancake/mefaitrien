// Post availability
import prisma from "@@/lib/prisma";
import { AvailabilityType } from "../../../generated/prisma/browser";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";
import { array, number, object, string } from "yup";
import type { SessionEvent } from "~/types";

const availabilityValues = Object.values(AvailabilityType) as readonly string[];

const selectedDateSchema = object({
  date: string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
    .test("valid-date", "Date is invalid", (value) => {
      if (!value) return false;
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    })
    .required("Date is required"),

  availability: string()
    .oneOf(availabilityValues, "Invalid availability")
    .required("Availability is required"),
});

const selectedDateArraySchema = array().of(selectedDateSchema).strict();

const schema = object({
  year: number().required().min(0),
  month: number().required().min(0).max(11),
  dates: selectedDateArraySchema,
});

let handlerFunc = async (event: SessionEvent) => {
  const body = await readBody(event);
  let data;

  try {
    data = await schema.validate(body);
  } catch (e: any) {
    console.error(e);
    throw createError({ status: 400, statusMessage: e.message });
  }

  // Filter dates to ensure they belong to the specified month and year
  const dates = data.dates ?? [];
  const filteredDates = dates.filter((x) => {
    const [year, month] = x.date.split("-").map(Number);
    return year === data.year && month === data.month + 1;
  });

  if (dates.length > 0 && filteredDates.length === 0) {
    throw createError({
      status: 400,
      statusMessage: "No valid dates provided for the specified month and year",
    });
  }

  // Find the month roster
  const monthRoster = await prisma.monthRoster.findFirst({
    where: {
      year: data.year,
      month: data.month + 1, // Adjust for 0-based month in JS
      status: "CANFILLIN", // Only allow updates when month is in CANFILLIN status
    },
  });

  if (!monthRoster) {
    throw createError({
      status: 404,
      statusMessage: "Kon geen toegestane maand vinden",
    });
  }

  // Delete existing availabilities for this user and month
  await prisma.availability.deleteMany({
    where: {
      userId: event.session.id,
      monthRosterId: monthRoster.id,
    },
  });

  // Create new availabilities
  const availabilities = filteredDates.length
    ? await prisma.availability.createMany({
        data: filteredDates.map((date) => ({
          userId: event.session.id,
          monthRosterId: monthRoster.id,
          day: Number(date.date.slice(-2)),
          availability: date.availability as AvailabilityType,
        })),
      })
    : { count: 0 };

  return { count: availabilities.count };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking/availability",
    method: "POST",
    allowType: "AUTHENTICATED",
  });
});
