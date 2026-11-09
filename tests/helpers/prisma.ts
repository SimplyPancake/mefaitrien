import { vi } from "vitest";

// Auto-creating Prisma mock: `prismaMock.user.findMany` is a vi.fn() created on first access.
// Reset between tests by vitest's `mockReset`.
const fns = new Map<string, ReturnType<typeof vi.fn>>();
const model = (name: string) =>
	new Proxy({}, {
		get: (_, op: string) => {
			const key = `${name}.${op}`;
			if (!fns.has(key)) fns.set(key, vi.fn());
			return fns.get(key)!;
		},
	});

export const prismaMock: any = new Proxy({}, {
	get: (_, name: string) =>
		name === "$transaction"
			? (arg: any) => (typeof arg === "function" ? arg(prismaMock) : Promise.all(arg))
			: model(name),
});
