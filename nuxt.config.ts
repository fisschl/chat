export default defineNuxtConfig({
  app: {
    baseURL: "/chat/",
  },

  modules: ["@nuxt/eslint", "@nuxt/ui"],

  devtools: {
    enabled: true,
  },

  ui: {
    fonts: false,
  },

  css: ["~/assets/css/main.css"],

  compatibilityDate: "2025-12-15",
});
