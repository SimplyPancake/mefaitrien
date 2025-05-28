import { useAuth } from "#imports";
import { defineStore } from "pinia";
import { computed } from "vue";
import type { SessionDataDto } from "~/types";

export const useSessionStore = defineStore("session", () => {
  const { data, status, signOut } = useAuth();

  // Computed property that casts data to SessionDataDto (or null)
  const sessionData = computed(() => {
    return data.value as SessionDataDto | null;
  });

  const isAuthenticated = computed(() => status.value == "authenticated");
  // Expose status and data for use in app.vue if needed
  return { data, sessionData, isAuthenticated, status, signOut };
});
