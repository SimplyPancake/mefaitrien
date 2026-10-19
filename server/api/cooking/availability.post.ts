// Post availability
import prisma from "@@/lib/prisma";
import { AvailabilityType } from "../../../generated/prisma/browser";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";
import { array, date, number, object, string } from "yup";
import type { SessionEvent } from "~/types";

const availabilityValues = Object.values(AvailabilityType) as readonly string[];

const selectedDateSchema = object({
  date: date()
    .transform((value, originalValue) => {
      return typeof originalValue === "string" ? new Date(originalValue) : originalValue;
    })
    .required("Date is required"),

  availability: string()
    .oneOf(availabilityValues, "Invalid availability")
    .required("Availability is required"),
});

const selectedDateArraySchema = array().of(selectedDateSchema).strict();

const schema = object({
  year: number().required().min(0),
  month: number().required().min(1).max(12),
  dates: selectedDateArraySchema,
});

let handlerFunc = async (event: SessionEvent) => {
  const body = await readBody(event);
  let data;

  try {
    data = await schema.cast(body);
  } catch (e: any) {
    console.error(e);
    throw createError({ status: 400, statusMessage: e.message });
  }

  // Filter dates to ensure they belong to the specified month and year
  const filteredDates = data.dates?.filter(
    (x) => x.date.getMonth() == data.month && x.date.getFullYear() == data.year
  );

  if (!filteredDates || filteredDates.length === 0) {
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
  const availabilities = await prisma.availability.createMany({
    data: filteredDates.map((date) => ({
      userId: event.session.id,
      monthRosterId: monthRoster.id,
      day: date.date.getDate(),
      availability: date.availability as AvailabilityType,
    })),
  });

  return { count: availabilities.count };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking/availability",
    method: "POST",
    allowType: "AUTHENTICATED",
  });
});
