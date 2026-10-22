// https://nuxt.com/docs/api/configuration/nuxt-config
const fileStorageMount = process.env.FILE_STORAGE_MOUNT ?? "/media/storage";

export default defineNuxtConfig({
  srcDir: ".",
  compatibilityDate: "2024-11-01",
  devtools: {
    enabled: true,
  },

  postcss: {
    plugins: {
      "tailwindcss/nesting": false,
      "postcss-nesting": {},
    },
  },

  runtimeConfig: {
    baseUrl: process.env.BASE_URL,
    jwtSecret: process.env.NUXT_JWT_SECRET ?? process.env.JWT_SECRET,
    authMiddleware: {
      routes: [
        { route: "/api/auth/login", method: "post", allowType: "ANYONE" },
        { route: "/api/auth/logout", method: "post", allowType: "ANYONE" },
        { route: "/api/auth/session", method: "get", allowType: "ANYONE" },
        { route: "/api/account/settings", method: "get", allowType: "AUTHENTICATED" },
        { route: "/api/account/settings", method: "put", allowType: "AUTHENTICATED" },
        { route: "/api/account/password", method: "post", allowType: "AUTHENTICATED" },
        { route: "/api/account/calendar-token", method: "post", allowType: "AUTHENTICATED" },
        { route: "/api/admin", method: "get", allowType: "ROLE", role: ["admin"] },
        { route: "/api/admin/users", method: "get", allowType: "ROLE", role: ["admin"] },
      ],
    },
    public: {
      fileStorage: {
        mount: fileStorageMount,
      },
    },
  },

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@nuxt/icon",
    "@nuxt/fonts",
    "@vee-validate/nuxt",
    "@morev/vue-transitions/nuxt",
    "@sidebase/nuxt-auth",
    "@pinia/nuxt",
    "nuxt-file-storage"
  ],

  fileStorage: {
    mount: fileStorageMount
  },

  colorMode: {
    preference: "dark",
    classSuffix: "",
  },

  auth: {
    globalAppMiddleware: true,
    isEnabled: true,
    originEnvKey: "NUXT_BASE_URL",
    provider: {
      type: "local",
      endpoints: {
        signUp: false,
        signIn: { path: "/login", method: "post" },
        signOut: { path: "/logout", method: "post" },
        getSession: { path: "/session", method: "get" },
      },
      pages: {
        login: "/auth/login",
      },
      token: {
        signInResponseTokenPointer: "/token/bearer",
        type: "Bearer",
        cookieName: "auth.token",
        headerName: "Authorization",
        maxAgeInSeconds: 86400,
      },
      session: {
        dataType: {
          id: "string | number",
          name: "string",
          username: "string",
          roles: "string[]",
        },
      },
    },
    sessionRefresh: {
      enablePeriodically: true,
      enableOnWindowFocus: true,
    },
  },

  tailwindcss: {
    exposeConfig: true,
    editorSupport: true,
  },

  imports: {
    imports: [
      {
        from: "tailwind-variants",
        name: "tv",
      },
      {
        from: "tailwind-variants",
        name: "VariantProps",
        type: true,
      },
      {
        from: "vue-sonner",
        name: "toast",
        as: "useSonner",
      },
    ],
  },

  build: {
    transpile: ["vue-sonner", "v-calendar", "@popperjs/core"],
  },

  css: ["@/assets/css/full-calendar.css", "v-calendar/style.css"],
});