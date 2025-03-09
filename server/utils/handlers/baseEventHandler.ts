import { ServerAuthConfig, SessionEvent } from "~/types";
import { H3Event } from "h3";

import { checkAccess, checkAccessConfig } from "../../utils/auth";

export class BaseEventHandler {
  protected event: H3Event;
  protected handlerFunc: (event: SessionEvent) => Promise<Response>;

  public constructor(event: H3Event, handlerFunc: (event: SessionEvent) => Promise<any>) {
    this.event = event;
    this.handlerFunc = handlerFunc;
  }

  public async handle(): Promise<Response> {
    let authenticated = await checkAccess(this.event);

    if (!authenticated.granted) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!authenticated.sessionData) {
      authenticated.sessionData = await getSessionDataEvent(this.event);
    }

    let event = this.event as SessionEvent;
    event.session = authenticated.sessionData!;

    return await this.handlerFunc(event);
  }

  public async handleConfig(config: ServerAuthConfig): Promise<Response> {
    const authenticated = await checkAccessConfig(this.event, config);

    if (!authenticated.sessionData) {
      authenticated.sessionData = await getSessionDataEvent(this.event);
    }

    let event = this.event as SessionEvent;
    event.session = authenticated.sessionData!;

    return await this.handlerFunc(event);
  }
}
