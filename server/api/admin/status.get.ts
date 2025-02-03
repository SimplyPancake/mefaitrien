import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";

type AdminStatusDto = {
  users: {
    amountFeut: number;
    amount: number;
    amountAdmin: number;
  };
  cooking: {
    filledInThisMonth: number;
    filledInNextMonth: number;
  };
};

let handlerFunc = async (event: H3Event) => {
  // Hoeveel kookgroepen
  //
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle();
});
