// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  runtimeConfig: {
    baseUrl: process.env.BASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    authMiddleware: {
      routes: [
        { route: "/api/auth/login", method: "post", allowType: "ANYONE" },
        { route: "/api/auth/logout", method: "post", allowType: "ANYONE" },
        { route: "/api/auth/session", method: "get", allowType: "ANYONE" },
        { route: "/api/admin", method: "get", allowType: "ROLE", role: ["admin"] },
        { route: "/api/admin/users", method: "get", allowType: "ROLE", role: ["admin"] },
        { route: "/api/cooking/", method: "get", allowType: "AUTHENTICATED" },
      ],
    },
    public: {},
  },

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@nuxt/icon",
    "@nuxt/fonts",
    "@vee-validate/nuxt",
    "@morev/vue-transitions/nuxt",
    "@prisma/nuxt",
    "@sidebase/nuxt-auth",
    "@samk-dev/nuxt-vcalendar",
  ],

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
          role: "string",
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
    transpile: ["vue-sonner"],
  },
});
