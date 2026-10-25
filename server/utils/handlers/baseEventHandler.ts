import { ServerAuthConfig, SessionEvent } from "~/types";
import { H3Event } from "h3";
import { AnySchema } from "yup";

import { checkAccess, checkAccessConfig } from "../../utils/auth";

export class BaseEventHandler<T> {
  protected event: H3Event;
  protected schema?: AnySchema;
  protected handlerFunc: (event: SessionEvent) => Promise<T>;

  public constructor(
    event: H3Event,
    handlerFunc: (event: SessionEvent) => Promise<any>,
    schema?: AnySchema
  ) {
    this.event = event;
    this.handlerFunc = handlerFunc;

    this.schema = schema;
  }

  public async handle(config?: ServerAuthConfig): Promise<T> {
    let authenticated: any;

    if (config) {
      authenticated = await checkAccessConfig(this.event, config);
    } else {
      authenticated = await checkAccess(this.event);
    }

    if (!authenticated.granted) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized"
      })
    }

    if (!authenticated.sessionData) {
      authenticated.sessionData = await getSessionDataEvent(this.event);
    }

    let event = this.event as SessionEvent;
    event.session = authenticated.sessionData!;

    // Body
    // TODO: Use schema cast
    if (this.schema) {
      const body = await readBody(event);

      try {
        await this.schema.validate(body);
      } catch (e: any) {
        console.error(e);
        throw createError({ status: 400, statusMessage: e.message });
      }

      // No errors, so we set the event body
      event.data = this.schema.cast(body);
      event.schema = this.schema;
    }

    return await this.handlerFunc(event);
  }
}
