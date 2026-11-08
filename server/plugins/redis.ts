import redisDriver from "unstorage/drivers/redis";

// Mounted at runtime so NUXT_REDIS_URI works in the built Docker image
export default defineNitroPlugin(() => {
  useStorage().mount("redis", redisDriver({ host: useRuntimeConfig().redisUri, port: 6379 }));
});
