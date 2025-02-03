import { H3Event } from "h3";

import { checkAccess } from "../../utils/auth";

export class BaseEventHandler {
  protected event: H3Event;
  protected handlerFunc: (event: H3Event) => Promise<Response>;

  public constructor(event: H3Event, handlerFunc: (event: H3Event) => Promise<any>) {
    this.event = event;
    this.handlerFunc = handlerFunc;
  }

  public async handle(): Promise<Response> {
    const isAuthenticated = await checkAccess(this.event);

    if (!isAuthenticated) {
      return new Response("Unauthorized", { status: 401 });
    }

    return await this.handlerFunc(this.event);
  }
}
