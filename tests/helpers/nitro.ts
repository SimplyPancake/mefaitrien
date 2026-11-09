import { vi } from "vitest";

// Stand-in for Nitro's `useStorage("redis")`; JSON round-trip like the real driver.
export const redis = new Map<string, string>();

export const installNitroGlobals = () => {
	vi.stubGlobal("useStorage", () => ({
		getItem: async (key: string) => (redis.has(key) ? JSON.parse(redis.get(key)!) : null),
		setItem: async (key: string, value: unknown) => void redis.set(key, JSON.stringify(value)),
		removeItem: async (key: string) => void redis.delete(key),
	}));
	vi.stubGlobal("defineEventHandler", (fn: unknown) => fn);
	vi.stubGlobal("createError", (e: any) => Object.assign(new Error(e.statusMessage), e));
	vi.stubGlobal("getRouterParams", (event: any) => event.params ?? {});
	vi.stubGlobal("readBody", async (event: any) => event.body);
	vi.stubGlobal("getQuery", (event: any) => event.query ?? {});
};

// Faithful enough BaseEventHandler: skips auth, but validates/casts the body like the real one.
export class FakeBaseEventHandler {
	constructor(private event: any, private fn: any, private schema?: any) {}
	async handle() {
		if (this.schema) {
			try {
				await this.schema.validate(this.event.body);
			} catch (e: any) {
				throw Object.assign(new Error(e.message), { statusCode: 400, statusMessage: e.message });
			}
			this.event.data = this.schema.cast(this.event.body);
		}
		return this.fn(this.event);
	}
}
