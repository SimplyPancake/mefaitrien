import { defineStore } from "pinia";

export const usePageInfoStore = defineStore("pageInfo", {
  state: () => ({
    title: "",
    subtitle: "",
  }),
  actions: {
    setPageInfo({ title }: { title: string }) {
      this.title = title;
    },
  },
});
