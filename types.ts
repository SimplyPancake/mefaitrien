import type { H3Event, HTTPMethod } from "h3";
import type { AnySchema } from "yup";

export enum AllowType {
  ANYONE,
  AUTHENTICATED,
  ROLE,
}

export type ServerAuthConfig = {
  route: string;
  method: HTTPMethod;
  allowType: AllowType | string;
  role?: string[];
};

export interface SessionData {
  id: number;
  name: string;
  username: string;
  cookingGroup: string;
  role: string;
  // Add any future properties here
  // [key: string]: any;
}

export type SessionDataDto = SessionData;

export interface SessionEvent extends H3Event {
  session: SessionDataDto;
  schema?: AnySchema;
  data?: any;
}
