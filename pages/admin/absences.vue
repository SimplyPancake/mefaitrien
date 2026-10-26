<template>
  <div class="flex w-full min-w-0 max-w-full flex-col gap-5 overflow-x-hidden xl:max-w-7xl">
    <section class="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <h1 class="font-semibold">Afwezigheid registreren</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Registreer meerdere afwezigheidsperiodes per gebruiker. Laat de einddatum leeg voor een open periode.
      </p>

      <form class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end" @submit.prevent="saveAbsence">
        <div class="grid gap-1.5 text-sm">
          <UiLabel for="absence-user">Gebruiker</UiLabel>
          <select
            id="absence-user"
            v-model.number="userId"
            class="h-10 rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            <option :value="0" disabled>Selecteer een gebruiker</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.name }}{{ user.isActive ? "" : " (inactief)" }}
            </option>
          </select>
        </div>
        <div class="grid gap-1.5 text-sm">
          <UiLabel for="absence-start">Begindatum</UiLabel>
          <UiInput id="absence-start" v-model="start" type="date" required />
        </div>
        <div class="grid gap-1.5 text-sm">
          <UiLabel for="absence-end">Einddatum (optioneel)</UiLabel>
          <UiInput id="absence-end" v-model="end" type="date" :min="start || undefined" />
        </div>
        <UiButton type="submit" :disabled="saving || !users.length || !userId || !start">
          <Icon :name="saving ? 'svg-spinners:180-ring' : 'lucide:plus'" class="mr-2 size-4" />
          {{ saving ? "Opslaan..." : "Afwezigheid toevoegen" }}
        </UiButton>
      </form>
    </section>

    <section class="overflow-hidden rounded-xl border bg-card shadow-sm">
      <header class="border-b px-4 py-3">
        <h2 class="font-semibold">Geregistreerde afwezigheden</h2>
        <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-muted-foreground">
            {{ absences.length }} {{ absences.length === 1 ? "periode" : "periodes" }}, per gebruiker
          </p>
          <div class="flex items-center gap-2">
            <UiButton
              v-if="displayedYear !== currentYear"
              type="button"
              variant="ghost"
              size="sm"
              @click="displayedYear = currentYear"
            >
              Dit jaar
            </UiButton>
            <UiButton type="button" variant="outline" size="icon" :aria-label="`Toon ${displayedYear - 1}`" @click="displayedYear--">
              <Icon name="lucide:chevron-left" class="size-4" />
            </UiButton>
            <span class="min-w-12 text-center text-sm font-semibold tabular-nums">{{ displayedYear }}</span>
            <UiButton type="button" variant="outline" size="icon" :aria-label="`Toon ${displayedYear + 1}`" @click="displayedYear++">
              <Icon name="lucide:chevron-right" class="size-4" />
            </UiButton>
          </div>
        </div>
      </header>

      <div v-if="loading" class="px-4 py-8 text-center text-sm text-muted-foreground">
        Afwezigheden laden...
      </div>
      <div v-else-if="loadError" class="p-4 text-sm text-destructive">
        {{ loadError }}
      </div>
      <div v-else-if="groupedUsers.length" class="divide-y">
        <article v-for="group in groupedUsers" :key="group.id" class="px-4 py-4">
          <header class="mb-3 flex items-baseline justify-between gap-3">
            <h3 class="truncate text-sm font-semibold">{{ group.name }}</h3>
            <span class="shrink-0 text-xs text-muted-foreground">
              {{ group.absences.length }} {{ group.absences.length === 1 ? "periode" : "periodes" }}
            </span>
          </header>

          <div class="overflow-x-auto">
            <div class="min-w-[42rem]">
              <div class="grid grid-cols-12 text-[0.65rem] text-muted-foreground">
                <span v-for="month in months" :key="month" class="border-l px-1 capitalize">
                  {{ month }}
                </span>
              </div>
              <div class="mt-1 space-y-1">
                <div
                  v-for="absence in absencesInDisplayedYear(group.absences)"
                  :key="absence.id"
                  class="relative h-3 rounded-sm bg-muted/70"
                >
                  <span
                    class="absolute inset-y-0 rounded-sm bg-primary"
                    :style="timelineStyle(absence)"
                    :title="`${formatDate(absence.start)} – ${absence.end ? formatDate(absence.end) : 'Geen einddatum'}`"
                    :aria-label="`Afwezig van ${formatDate(absence.start)} tot ${absence.end ? formatDate(absence.end) : 'geen einddatum'}`"
                  />
                </div>
                <p
                  v-if="!absencesInDisplayedYear(group.absences).length"
                  class="py-1 text-xs text-muted-foreground"
                >
                  Geen afwezigheden in {{ displayedYear }}.
                </p>
              </div>
            </div>
          </div>

          <ul class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <li
              v-for="absence in group.absences"
              :key="absence.id"
              class="flex min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <span class="min-w-0 text-xs">
                <span class="block truncate font-medium">
                  {{ formatDate(absence.start) }} – {{ absence.end ? formatDate(absence.end) : "Geen einddatum" }}
                </span>
                <span v-if="!isInDisplayedYear(absence)" class="text-muted-foreground">
                  Buiten {{ displayedYear }}
                </span>
              </span>
              <UiButton
                type="button"
                variant="ghost"
                size="icon"
                class="size-8 shrink-0 text-destructive hover:text-destructive"
                :disabled="deletingId === absence.id"
                :aria-label="`Verwijder afwezigheid van ${group.name}`"
                @click="deleteAbsence(absence.id)"
              >
                <Icon :name="deletingId === absence.id ? 'svg-spinners:180-ring' : 'lucide:trash-2'" class="size-4" />
              </UiButton>
            </li>
          </ul>
        </article>
      </div>
      <p v-else class="px-4 py-8 text-center text-sm text-muted-foreground">
        Er zijn nog geen afwezigheden geregistreerd.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
interface AbsenceAdminData {
  users: { id: number; name: string; isActive: boolean }[];
  absences: {
    id: number;
    userId: number;
    start: string;
    end: string | null;
    user: { name: string };
  }[];
}

usePageInfoStore().setPageInfo({ title: "Afwezigheden beheren" });
useSeoMeta({ title: "Afwezigheden beheren" });

const { $api } = useNuxtApp();
const { data, error, refresh, status } = await useAPI<AbsenceAdminData>("/api/admin/absences");
const users = computed(() => data.value?.users ?? []);
const absences = computed(() => data.value?.absences ?? []);
const loading = computed(() => status.value === "pending");
const currentYear = new Date().getFullYear();
const displayedYear = ref(currentYear);
const months = computed(() =>
  Array.from({ length: 12 }, (_, month) =>
    new Date(Date.UTC(displayedYear.value, month, 1)).toLocaleDateString("nl-NL", {
      month: "short",
      timeZone: "UTC",
    })
  )
);
const groupedUsers = computed(() =>
  users.value.flatMap((user) => {
    const userAbsences = absences.value
      .filter((absence) => absence.userId === user.id)
      .sort((left, right) => left.start.localeCompare(right.start));
    return userAbsences.length ? [{ ...user, absences: userAbsences }] : [];
  })
);
const loadError = computed(() =>
  error.value ? error.value.statusMessage ?? "Afwezigheden konden niet worden opgehaald." : ""
);

const userId = ref(0);
const start = ref("");
const end = ref("");
const saving = ref(false);
const deletingId = ref<number | null>(null);

watch(
  users,
  (entries) => {
    if (entries.length && !entries.some((user) => user.id === userId.value)) {
      userId.value = entries[0]!.id;
    }
  },
  { immediate: true }
);

if (error.value) {
  useSonner.error(error.value.statusMessage ?? "Afwezigheden konden niet worden opgehaald.");
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("nl-NL", { timeZone: "UTC" });

const absenceRange = (absence: AbsenceAdminData["absences"][number]) => {
  const start = Date.parse(`${absence.start.slice(0, 10)}T00:00:00.000Z`);
  const end = absence.end
    ? Date.parse(`${absence.end.slice(0, 10)}T00:00:00.000Z`) + 24 * 60 * 60 * 1000
    : Number.POSITIVE_INFINITY;
  return { start, end };
};

const isInDisplayedYear = (absence: AbsenceAdminData["absences"][number]) => {
  const yearStart = Date.UTC(displayedYear.value, 0, 1);
  const yearEnd = Date.UTC(displayedYear.value + 1, 0, 1);
  const range = absenceRange(absence);
  return range.start < yearEnd && range.end > yearStart;
};

const absencesInDisplayedYear = (entries: AbsenceAdminData["absences"]) =>
  entries.filter(isInDisplayedYear);

const timelineStyle = (absence: AbsenceAdminData["absences"][number]) => {
  const yearStart = Date.UTC(displayedYear.value, 0, 1);
  const yearEnd = Date.UTC(displayedYear.value + 1, 0, 1);
  const range = absenceRange(absence);
  const visibleStart = Math.max(range.start, yearStart);
  const visibleEnd = Math.min(range.end, yearEnd);
  const yearDuration = yearEnd - yearStart;
  const left = ((visibleStart - yearStart) / yearDuration) * 100;
  const width = ((visibleEnd - visibleStart) / yearDuration) * 100;
  return {
    left: `${left}%`,
    width: `max(${width}%, 4px)`,
  };
};

const errorMessage = (cause: unknown, fallback: string) => {
  if (typeof cause === "object" && cause !== null) {
    const requestError = cause as {
      data?: { statusMessage?: string };
      statusMessage?: string;
    };
    return requestError.data?.statusMessage ?? requestError.statusMessage ?? fallback;
  }
  return fallback;
};

const saveAbsence = async () => {
  if (!userId.value || !start.value || (end.value && end.value < start.value)) {
    useSonner.error("Selecteer een gebruiker en een geldige periode.");
    return;
  }

  saving.value = true;
  try {
    await $api("/api/admin/absences", {
      method: "POST",
      body: { userId: userId.value, start: start.value, end: end.value || null },
    });
    start.value = "";
    end.value = "";
    await refresh();
    useSonner.success("Afwezigheid opgeslagen.");
  } catch (cause) {
    useSonner.error(errorMessage(cause, "Afwezigheid kon niet worden opgeslagen."));
  } finally {
    saving.value = false;
  }
};

const deleteAbsence = async (id: number) => {
  if (!window.confirm("Weet je zeker dat je deze afwezigheid wilt verwijderen?")) return;

  deletingId.value = id;
  try {
    await $api("/api/admin/absences/delete", {
      method: "POST",
      body: { id },
    });
    await refresh();
    useSonner.success("Afwezigheid verwijderd.");
  } catch (cause) {
    useSonner.error(errorMessage(cause, "Afwezigheid kon niet worden verwijderd."));
  } finally {
    deletingId.value = null;
  }
};
</script>
