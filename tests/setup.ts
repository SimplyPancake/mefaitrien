import { beforeEach, vi } from "vitest";
import { FakeBaseEventHandler, installNitroGlobals, redis } from "./helpers/nitro";

vi.mock("@@/lib/prisma", async () => ({ default: (await import("./helpers/prisma")).prismaMock }));
vi.mock("~/server/utils/handlers/baseEventHandler", async () => ({
	BaseEventHandler: (await import("./helpers/nitro")).FakeBaseEventHandler,
}));

installNitroGlobals();
beforeEach(() => redis.clear());
