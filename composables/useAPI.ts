import type { UseFetchOptions } from "nuxt/app";

// TODO: Fix [nuxt] [useFetch] Component is already mounted, please use $fetch instead. See https://nuxt.com/docs/getting-started/data-fetching
export function useAPI<T>(url: string | (() => string), options?: UseFetchOptions<T>) {
  return useFetch(url, {
    ...options,
    $fetch: useNuxtApp().$api as typeof $fetch,
  });
}
