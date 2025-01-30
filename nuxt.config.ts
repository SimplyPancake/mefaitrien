// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  runtimeConfig: {
    baseUrl: process.env.BASE_URL,
    jwtSecret: process.env.JWT_SECRET,
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
  ],

  auth: {
    isEnabled: true,
    originEnvKey: "NUXT_BASE_URL",
    provider: {
      type: "local",
      endpoints: {
        signUp: false,
        signIn: { path: "/api/auth/login", method: "post" },
        signOut: { path: "/api/auth/logout", method: "post" },
        getSession: { path: "/api/auth/session", method: "get" },
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

  colorMode: {
    classSuffix: "",
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
    ],
  },
});
