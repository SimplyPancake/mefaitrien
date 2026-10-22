// Post availability
import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";
import { array, date, InferType, number, object } from "yup";

const schema = object({
  dates: array(
    date()
      .transform((value, originalValue) => {
        return typeof originalValue === "string" ? new Date(originalValue) : originalValue;
      })
      .required()
  ),
  month: number().required(),
  year: number().required(),
});

type InferredFormData = InferType<typeof schema>;

let handlerFunc = async (event: H3Event) => {
  const body = await readBody(event);

  let data: InferredFormData;

  try {
    data = (await schema.validate(body)) as InferredFormData;
  } catch (e: any) {
    console.error(e);
    throw createError({ status: 400, statusMessage: e.message });
  }

  if (!data) {
    throw createError({ status: 400, statusMessage: "You need to supply dates" });
  }

  // Filter dates
  const year = data.year;
  const month = data.month;

  let dateObjects =
    data.dates?.filter((x) => x.getUTCFullYear() === year && x.getUTCMonth() + 1 === month) || [];

  // Map Date objects to { day: number } for Prisma nested creation
  const blockedDatesInput = dateObjects.map((date) => ({
    day: date.getUTCDate(),
  }));

  console.log(blockedDatesInput);

  try {
    const monthRoster = await prisma.monthRoster.create({
      data: {
        month,
        year,
        blockedDates: {
          create: blockedDatesInput,
        },
        status: "CANFILLIN",
      },
    });

    return monthRoster;
  } catch (e) {
    throw createError({ status: 500, statusMessage: "Kon geen maandrooster aanmaken" });
  }
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking/roster/create",
    method: "POST",
    allowType: "AUTHENTICATED",
    role: ["ADMIN", "COOKING"],
  });
});
