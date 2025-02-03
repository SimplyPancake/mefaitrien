import { H3Event } from "h3";

export class BaseEventHandler {
  protected event: H3Event;
  protected handlerFunc: (event: H3Event) => Promise<any>;

  public constructor(event: H3Event, handlerFunc: (event: H3Event) => Promise<any>) {
    this.event = event;
    this.handlerFunc = handlerFunc;
  }

  public async handle(): Promise<any> {
    await this.checkAuthentication();
    return await this.handlerFunc(this.event);
  }

  protected async checkAuthentication(): Promise<void> {
    // Authentication checking logic to be implemented
    throw new Error("Method 'checkAuthentication' must be implemented.");
  }
}
