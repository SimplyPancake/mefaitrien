<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-5">
    <header class="rounded-xl border bg-card px-5 py-5 shadow-sm">
      <div class="flex items-start gap-3">
        <div class="rounded-lg bg-amber-500/10 p-2.5 text-amber-600">
          <Icon name="lucide:scale" class="size-5" />
        </div>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Afwaspenalty</h1>
          <p class="mt-1 text-sm text-muted-foreground">Voeg punten toe of trek ze af met een korte toelichting.</p>
        </div>
      </div>
    </header>

    <div v-if="error" class="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {{ error.statusMessage ?? "De gebruikers konden niet worden opgehaald." }}
    </div>

    <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
      <section class="rounded-xl border bg-card p-5 shadow-sm">
        <h2 class="font-semibold">Penalty registreren</h2>
        <p class="mt-1 text-sm text-muted-foreground">Een positief getal trekt punten af. Een negatief getal herstelt punten.</p>
        <form class="mt-5 space-y-4" @submit.prevent="savePenalty">
          <div class="grid gap-1.5 text-sm">
            <UiLabel>Huisgenoot</UiLabel>
            <UiSelect :model-value="userId ? String(userId) : undefined" @update:model-value="userId = Number($event)">
              <UiSelectTrigger placeholder="Selecteer een huisgenoot" />
              <UiSelectContent>
                <UiSelectItem
                  v-for="user in users"
                  :key="user.id"
                  :value="String(user.id)"
                  :text="`${user.name}${user.cookingGroupName ? ` · ${user.cookingGroupName}` : ''}`"
                />
              </UiSelectContent>
            </UiSelect>
          </div>
          <div class="grid gap-1.5 text-sm">
            <UiLabel>Punten</UiLabel>
            <UiInput v-model.number="amount" type="number" step="1" required />
            <span class="text-xs text-muted-foreground">{{ amount > 0 ? `${amount} punten aftrek` : amount < 0 ? `${Math.abs(amount)} punten herstel` : "Vul een waarde ongelijk aan nul in" }}</span>
          </div>
          <div class="grid gap-1.5 text-sm">
            <UiLabel>Reden</UiLabel>
            <UiInput v-model.trim="reason" maxlength="500" required placeholder="Waarom worden punten aangepast?" />
          </div>
          <UiButton type="submit" :disabled="saving || users.length === 0 || amount === 0 || !reason">
            <Icon :name="saving ? 'svg-spinners:180-ring' : 'lucide:plus'" class="mr-2 size-4" />
            {{ saving ? "Opslaan..." : "Penalty opslaan" }}
          </UiButton>
        </form>
      </section>

      <section class="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div class="border-b px-4 py-3">
          <h2 class="font-semibold">Huidige penaltypunten</h2>
          <p class="mt-1 text-xs text-muted-foreground">Negatieve penaltypunten herstellen het puntentotaal.</p>
          <button
            v-if="penaltyRegistrationCount > 0"
            type="button"
            class="mt-2 inline-flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
            @click="showPenaltyReasons = !showPenaltyReasons"
          >
            <Icon name="lucide:info" class="size-3.5" />
            {{ showPenaltyReasons ? "Verberg alle redenen" : "Toon alle penaltyredenen" }}
          </button>
        </div>
        <div v-if="users.length" class="max-h-[40rem] divide-y overflow-y-auto">
          <details v-for="user in users" :key="user.id" class="group" :open="showPenaltyReasons || (userId === user.id && user.penalties.length > 0)">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30">
              <span class="min-w-0">
                <span class="block truncate text-sm font-medium">{{ user.name }}</span>
                <span class="block truncate text-xs text-muted-foreground">{{ user.cookingGroupName ?? "Geen kookgroep" }} · {{ user.penalties.length }} registraties</span>
              </span>
              <span class="rounded-full bg-muted px-3 py-1 text-sm font-semibold tabular-nums">{{ user.penaltyPoints.toFixed(1) }}</span>
            </summary>
            <div v-if="user.penalties.length" class="space-y-2 border-t bg-muted/20 px-4 py-3">
              <div
                v-for="penalty in user.penalties"
                :key="penalty.id"
                class="flex items-start justify-between gap-3 rounded-lg border bg-card px-3 py-2.5"
              >
                <p class="min-w-0 flex-1 text-sm">{{ penalty.reason }}</p>
                <span
                  class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
                  :class="penalty.amount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'"
                >
                  {{ penalty.amount > 0 ? `-${penalty.amount}` : `+${Math.abs(penalty.amount)}` }}
                </span>
                <UiButton
                  v-if="isAdmin"
                  type="button"
                  variant="destructive"
                  size="icon"
                  class="size-8"
                  :disabled="deletingPenaltyId === penalty.id"
                  aria-label="Verwijder penalty"
                  @click="deletePenalty(penalty.id)"
                >
                  <Icon :name="deletingPenaltyId === penalty.id ? 'svg-spinners:180-ring' : 'lucide:trash-2'" class="size-4" />
                </UiButton>
              </div>
            </div>
            <p v-else class="border-t bg-muted/20 px-4 py-3 text-sm text-muted-foreground">Geen penaltyregistraties.</p>
          </details>
        </div>
        <p v-else class="px-4 py-8 text-center text-sm text-muted-foreground">Er zijn geen actieve huisgenoten.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WashingPointsOverviewDto } from "~/types/dto";
import { Role } from "~/generated/prisma/enums";

usePageInfoStore().setPageInfo({ title: "Afwaspenalty" });
useSeoMeta({ title: "Afwaspenalty" });

const { data, error, refresh } = await useAPI<WashingPointsOverviewDto>("/api/washing/points");
const sessionStore = useSessionStore();
const isAdmin = computed(() => sessionStore.sessionData?.roles.includes(Role.ADMIN) ?? false);
const users = computed(() => (data.value?.users ?? []).filter((user) => user.isActive));
const userId = ref(0);
const amount = ref(1);
const reason = ref("");
const saving = ref(false);
const deletingPenaltyId = ref<number | null>(null);
const showPenaltyReasons = ref(false);
const penaltyRegistrationCount = computed(() =>
  users.value.reduce((total, user) => total + user.penalties.length, 0)
);

watch(users, (entries) => {
  if (entries.length && !entries.some((user) => user.id === userId.value)) userId.value = entries[0]!.id;
}, { immediate: true });

if (error.value) {
  useSonner.error(error.value.statusMessage ?? "De gebruikers konden niet worden opgehaald.");
}

const deletePenalty = async (penaltyId: number) => {
  if (!window.confirm("Weet je zeker dat je deze penalty wilt verwijderen?")) return;

  deletingPenaltyId.value = penaltyId;
  try {
    const { $api } = useNuxtApp();
    await $api("/api/washing/penalty/delete", {
      method: "POST",
      body: { penaltyId },
    });
    await refresh();
    useSonner.success("Penalty verwijderd.");
  } catch (cause) {
    const requestError = cause as { data?: { statusMessage?: string }; statusMessage?: string };
    useSonner.error(requestError.data?.statusMessage ?? requestError.statusMessage ?? "Penalty kon niet worden verwijderd.");
  } finally {
    deletingPenaltyId.value = null;
  }
};

const savePenalty = async () => {
  if (!userId.value || !Number.isInteger(amount.value) || amount.value === 0 || !reason.value.trim()) {
    useSonner.error("Selecteer een gebruiker, vul een niet-nul geheel aantal punten en een reden in.");
    return;
  }

  saving.value = true;
  try {
    const { error: saveError } = await useAPI("/api/washing/penalty", {
      method: "POST",
      body: { userId: userId.value, amount: amount.value, reason: reason.value },
    });
    if (saveError.value) {
      useSonner.error(saveError.value.statusMessage ?? "De penalty kon niet worden opgeslagen.");
      return;
    }
    reason.value = "";
    amount.value = 1;
    await refresh();
    useSonner.success("Penalty opgeslagen.");
  } catch (cause) {
    const requestError = cause as { data?: { statusMessage?: string }; statusMessage?: string };
    useSonner.error(requestError.data?.statusMessage ?? requestError.statusMessage ?? "De penalty kon niet worden opgeslagen.");
  } finally {
    saving.value = false;
  }
};
</script>
