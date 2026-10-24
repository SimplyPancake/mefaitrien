<template>
  <div class="flex w-full min-w-0 max-w-full flex-col gap-5 overflow-x-hidden xl:max-w-7xl">
    <header class="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border bg-card px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <div class="flex min-w-0 items-start gap-3">
        <div class="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon name="lucide:chart-no-axes-combined" class="size-5" />
        </div>
        <div class="min-w-0">
          <h1 class="text-xl font-semibold tracking-tight">Afwaspunten</h1>
          <p class="mt-1 break-words text-sm text-muted-foreground">Een overzicht van de punten per kookgroep en huisgenoot.</p>
        </div>
      </div>
      <div class="rounded-lg bg-muted/60 px-4 py-2">
        <span class="text-xs text-muted-foreground">Totaal punten</span>
        <p class="text-xl font-semibold tabular-nums">{{ formatPoints(totalPoints) }}</p>
      </div>
    </header>

    <div v-if="error" class="min-w-0 break-words rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {{ error.statusMessage ?? "Het afwaspuntenoverzicht kon niet worden opgehaald." }}
    </div>

    <template v-if="data">
      <section class="grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        <article v-for="stat in summary" :key="stat.label" class="min-w-0 rounded-xl border bg-card p-3 shadow-sm sm:p-4">
          <div class="flex min-w-0 items-center gap-2 text-xs leading-tight text-muted-foreground sm:text-sm">
            <Icon :name="stat.icon" class="size-4 text-primary" />
            <span class="break-words">{{ stat.label }}</span>
          </div>
          <p class="mt-2 text-xl font-semibold tabular-nums sm:text-2xl">{{ stat.value }}</p>
        </article>
      </section>

      <div class="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)]">
        <section class="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
          <div class="flex items-center justify-between border-b px-4 py-3">
            <div class="flex items-center gap-2">
              <Icon name="lucide:trophy" class="size-4 text-amber-500" />
              <h2 class="font-semibold">Alle huisgenoten</h2>
            </div>
            <span class="text-xs text-muted-foreground">{{ standings.length }} actief</span>
          </div>
          <div v-if="standings.length" class="divide-y">
              <div v-for="(user, index) in standings" :key="user.id"
                class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-3 py-3 sm:grid-cols-[2rem_minmax(0,1fr)_auto_auto_auto] sm:gap-3 sm:px-4">
                <span class="hidden text-center text-sm font-semibold text-muted-foreground sm:block">{{ index + 1 }}</span>
                <div class="col-start-1 row-start-1 flex min-w-0 items-center gap-3 sm:col-auto sm:row-auto">
                  <UserProfilePicture :user-id="user.id" :name="user.name" :size="34" />
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium">{{ user.name }}</p>
                    <p class="truncate text-xs text-muted-foreground">{{ user.cookingGroupName ?? "Geen kookgroep" }}</p>
                  </div>
                </div>
                <div v-if="isAdmin" class="col-start-1 row-start-2 flex min-w-0 items-center gap-1 sm:col-auto sm:row-auto sm:gap-1.5">
                  <span class="text-xs text-muted-foreground">Basis</span>
                  <UiInput v-model.number="basePoints[user.id]" type="number" step="1"
                    class="h-8 w-16 px-2 text-right text-xs sm:w-20" :aria-label="`Basispunten voor ${user.name}`" />
                  <UiButton type="button" size="icon" class="size-8"
                    :disabled="basePoints[user.id] === user.basePoints || savingBasePointsUserId === user.id"
                    :aria-label="`Sla basispunten op voor ${user.name}`" @click="saveBasePoints(user.id)">
                    <Icon :name="savingBasePointsUserId === user.id ? 'svg-spinners:180-ring' : 'lucide:save'"
                      class="size-4" />
                  </UiButton>
                </div>
                <span v-else class="col-start-1 row-start-2 text-xs tabular-nums text-muted-foreground sm:col-auto sm:row-auto sm:text-right"
                  title="Basis">Basis {{ formatPoints(user.basePoints) }}</span>
                <span class="col-start-2 row-start-2 text-right text-xs tabular-nums text-muted-foreground sm:col-auto sm:row-auto"
                  title="Afwasregistraties">Afwas {{ signed(user.computedPoints) }}</span>
                <span class="col-start-2 row-start-1 shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-semibold tabular-nums sm:col-auto sm:row-auto">{{ formatPoints(user.washingpoints) }}</span>
              </div>
          </div>
          <p v-else class="px-4 py-8 text-center text-sm text-muted-foreground">Er zijn geen actieve gebruikers om te
            tonen.</p>
        </section>

        <section class="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
          <div class="flex items-center gap-2 border-b px-4 py-3">
            <Icon name="lucide:users-round" class="size-4 text-primary" />
            <h2 class="font-semibold">Per kookgroep</h2>
          </div>
          <div v-if="groupSummaries.length" class="divide-y">
            <details v-for="group in groupSummaries" :key="group.id" class="group">
              <summary
                class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30">
                <span class="min-w-0">
                  <span class="block truncate text-sm font-semibold">{{ group.name }}</span>
                  <span class="text-xs text-muted-foreground">{{ group.users.length }} huisgenoten · gemiddeld {{
                    group.average }} punten</span>
                </span>
                <span class="flex shrink-0 items-center gap-2">
                  <span class="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold tabular-nums text-primary">{{
                    formatPoints(group.total) }}</span>
                  <Icon name="lucide:chevron-down"
                    class="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <div class="divide-y bg-muted/20 px-4">
                <div v-for="user in group.users" :key="user.id" class="flex items-center justify-between gap-3 py-2">
                  <span class="truncate text-sm">{{ user.name }}</span>
                  <span class="text-sm font-semibold tabular-nums">{{ formatPoints(user.washingpoints) }}</span>
                </div>
              </div>
            </details>
          </div>
          <p v-else class="px-4 py-8 text-center text-sm text-muted-foreground">Er zijn nog geen kookgroepen.</p>
        </section>
      </div>
      <section v-if="isAdmin" class="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div class="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div class="min-w-0">
            <h2 class="font-semibold">Afwasregistraties beheren</h2>
            <p class="mt-1 break-words text-xs text-muted-foreground">Verwijder een volledige dagregistratie als admin.</p>
          </div>
          <span class="rounded-full bg-muted px-3 py-1 text-xs tabular-nums">{{ registrations.length }}</span>
        </div>
        <div v-if="registrationError" class="p-4 text-sm text-destructive">
          {{ registrationError }}
        </div>
        <div v-else-if="registrations.length" class="max-h-[32rem] divide-y overflow-y-auto">
          <div v-for="registration in registrations" :key="registration.id" class="flex items-center gap-3 px-4 py-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">
                {{ formatDate(registration.year, registration.month, registration.day) }} · {{
                  registration.cookingGroupName }}
              </p>
              <p class="mt-0.5 truncate text-xs text-muted-foreground">
                Kok: {{ registration.cookName }} · Afwassers: {{ registration.washUserOneName }} &amp; {{
                  registration.washUserTwoName }}
              </p>
              <p v-if="registration.eaters.length" class="mt-0.5 truncate text-xs text-muted-foreground">
                Mee-eters: {{registration.eaters.map(({ name, amountEat }) => `${name} (${amountEat})`).join(", ")}}
              </p>
            </div>
            <UiButton type="button" variant="destructive" size="sm"
              :disabled="deletingRegistrationId === registration.id" aria-label="Verwijder afwasregistratie"
              @click="deleteRegistration(registration.id)">
              <Icon :name="deletingRegistrationId === registration.id ? 'svg-spinners:180-ring' : 'lucide:trash-2'"
                class="size-4" />
            </UiButton>
          </div>
        </div>
        <p v-else class="px-4 py-8 text-center text-sm text-muted-foreground">Geen afwasregistraties gevonden.</p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { WashingPointsOverviewDto, WashingRegistrationAdminDto } from "~/types/dto";
import { Role } from "~/generated/prisma/enums";

usePageInfoStore().setPageInfo({ title: "Afwaspunten" });
useSeoMeta({ title: "Afwaspunten" });

const { data, error, refresh } = await useAPI<WashingPointsOverviewDto>("/api/washing/points");
const sessionStore = useSessionStore();
const isAdmin = computed(() => sessionStore.sessionData?.roles.includes(Role.ADMIN) ?? false);
const registrations = ref<WashingRegistrationAdminDto[]>([]);
const registrationError = ref("");
const deletingRegistrationId = ref<number | null>(null);
const basePoints = reactive<Record<number, number>>({});
const savingBasePointsUserId = ref<number | null>(null);
const activeUsers = computed(() => (data.value?.users ?? []).filter((user) => user.isActive));
const standings = computed(() =>
  [...activeUsers.value].sort((a, b) => b.washingpoints - a.washingpoints || a.name.localeCompare(b.name))
);
const totalPoints = computed(() => activeUsers.value.reduce((sum, user) => sum + user.washingpoints, 0));
const summary = computed(() => [
  { label: "Huisgenoten", value: activeUsers.value.length, icon: "lucide:users-round" },
  { label: "Kookgroepen", value: data.value?.cookingGroups.length ?? 0, icon: "lucide:house" },
  { label: "Afwasregistraties", value: Math.round(data.value?.registrations ?? 0), icon: "lucide:bubbles" },
  { label: "Penaltypunten", value: activeUsers.value.reduce((sum, user) => sum + user.penaltyPoints, 0), icon: "lucide:triangle-alert" },
]);
const groupSummaries = computed(() =>
  (data.value?.cookingGroups ?? [])
    .map((group) => {
      const users = standings.value.filter((user) => user.cookingGroupId === group.id);
      const total = users.reduce((sum, user) => sum + user.washingpoints, 0);
      return { ...group, users, total, average: users.length ? (total / users.length).toFixed(1) : "0.0" };
    })
    .filter((group) => group.users.length)
    .sort((a, b) => a.name.localeCompare(b.name))
);
const formatPoints = (points: number) => points.toFixed(1);
const signed = (points: number) => `${points > 0 ? "+" : ""}${formatPoints(points)}`;

watch(
  activeUsers,
  (users) => {
    users.forEach((user) => {
      basePoints[user.id] = user.basePoints;
    });
  },
  { immediate: true }
);

if (error.value) {
  useSonner.error(error.value.statusMessage ?? "Het afwaspuntenoverzicht kon niet worden opgehaald.");
}

const formatDate = (year: number, month: number, day: number) =>
  new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(new Date(year, month - 1, day));

const saveBasePoints = async (userId: number) => {
  const value = basePoints[userId];
  if (!Number.isInteger(value)) {
    useSonner.error("Basispunten moeten een heel getal zijn.");
    return;
  }

  savingBasePointsUserId.value = userId;
  try {
    const { $api } = useNuxtApp();
    await $api("/api/washing/points/base", {
      method: "POST",
      body: { userId, basePoints: value },
    });
    await refresh();
    useSonner.success("Afwasbasispunten bijgewerkt.");
  } catch (cause) {
    const requestError = cause as { data?: { statusMessage?: string }; statusMessage?: string };
    useSonner.error(requestError.data?.statusMessage ?? requestError.statusMessage ?? "Afwasbasispunten konden niet worden bijgewerkt.");
  } finally {
    savingBasePointsUserId.value = null;
  }
};

if (isAdmin.value) {
  try {
    const { $api } = useNuxtApp();
    registrations.value = await $api<WashingRegistrationAdminDto[]>("/api/washing/registrations");
  } catch (cause) {
    const requestError = cause as { data?: { statusMessage?: string }; statusMessage?: string };
    registrationError.value =
      requestError.data?.statusMessage ?? requestError.statusMessage ?? "Afwasregistraties konden niet worden geladen.";
  }
}

const deleteRegistration = async (registrationId: number) => {
  if (!window.confirm("Weet je zeker dat je deze afwasregistratie wilt verwijderen?")) return;

  deletingRegistrationId.value = registrationId;
  try {
    const { $api } = useNuxtApp();
    await $api("/api/washing/registrations/delete", {
      method: "POST",
      body: { registrationId },
    });
    registrations.value = registrations.value.filter((registration) => registration.id !== registrationId);
    await refresh();
    useSonner.success("Afwasregistratie verwijderd.");
  } catch (cause) {
    const requestError = cause as { data?: { statusMessage?: string }; statusMessage?: string };
    useSonner.error(requestError.data?.statusMessage ?? requestError.statusMessage ?? "Afwasregistratie kon niet worden verwijderd.");
  } finally {
    deletingRegistrationId.value = null;
  }
};
</script>
