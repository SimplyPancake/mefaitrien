// Post availability
import prisma from "@@/lib/prisma";
import { AvailabilityType } from "@prisma/client";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";
import { array, date, object, string } from "yup";

const availabilityValues = Object.values(AvailabilityType) as readonly string[];

const selectedDateSchema = object({
  date: string()
    .transform((value, originalValue) => {
      return Date.parse(originalValue);
    })
    .required("Date is required"),

  availability: string()
    .oneOf(availabilityValues, "Invalid availability")
    .required("Availability is required"),
});

const selectedDateArraySchema = array().of(selectedDateSchema).strict();

let handlerFunc = async (event: H3Event) => {
  const body = await readBody(event);
  let data;

  try {
    data = await selectedDateArraySchema.validate(body);
  } catch (e: any) {
    console.error(e);
    throw createError({ status: 400, statusMessage: e.message });
  }

  // Now we set the availability in the db
  // TODO!!
  // First we must set the cooking person creator to create month rosters
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking/availability",
    method: "POST",
    allowType: "AUTHENTICATED",
  });
});
