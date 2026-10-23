<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-5">
    <header class="rounded-xl border bg-card px-5 py-5 shadow-sm">
      <div class="flex items-start gap-3">
        <div class="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon name="lucide:bubbles" class="size-5" />
        </div>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Afwas invullen</h1>
          <p class="mt-1 text-sm text-muted-foreground">
            Registreer afwassers en mee-eters per kookdag<span v-if="data?.group"> voor {{ data.group.name }}</span>.
          </p>
        </div>
      </div>
    </header>

    <div v-if="error" class="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {{ error.statusMessage ?? "De kookdagen konden niet worden opgehaald." }}
    </div>

    <section v-if="data && !data.group" class="rounded-xl border bg-card p-8 text-center shadow-sm">
      <Icon name="lucide:users-round" class="mx-auto size-8 text-muted-foreground" />
      <h2 class="mt-3 font-semibold">Je bent nog niet gekoppeld aan een kookgroep</h2>
      <p class="mt-1 text-sm text-muted-foreground">Je kunt afwas invullen zodra je aan een kookgroep bent toegevoegd.
      </p>
    </section>

    <div v-else-if="data?.group" class="flex flex-col gap-5">
      <section class="rounded-xl border bg-card p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 class="text-sm font-semibold">Stand van de kookgroep</h2>
            <p class="text-xs text-muted-foreground">Van laagste naar hoogste afwaspunten</p>
          </div>
          <Icon name="lucide:arrow-down-wide-narrow" class="size-4 shrink-0 text-muted-foreground" />
        </div>
        <div class="flex gap-2 overflow-x-auto pb-1">
          <div
            v-for="(member, index) in standings"
            :key="member.id"
            class="flex min-w-32 shrink-0 items-center justify-between gap-3 rounded-lg border px-3 py-2"
            :class="index === 0 ? 'border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/30' : 'bg-background'"
          >
            <span class="truncate text-sm font-medium">{{ member.name }}</span>
            <span class="shrink-0 text-sm font-semibold tabular-nums" :class="index === 0 ? 'text-rose-700 dark:text-rose-300' : ''">
              {{ formatPoints(member.washingpoints) }}
            </span>
          </div>
          <p v-if="!standings.length" class="text-sm text-muted-foreground">Geen actieve groepsleden.</p>
        </div>
      </section>

      <div class="grid items-start gap-5 lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.3fr)]">
      <section class="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div class="border-b px-4 py-3">
          <h2 class="font-semibold">Kookdagen</h2>
          <p class="mt-0.5 text-xs text-muted-foreground">{{ data.days.length }} dagen in {{ data.group.name }}</p>
        </div>
        <div v-if="data.days.length" class="max-h-[38rem] divide-y overflow-y-auto"
          @scroll.passive="loadWhenNearBottom">
          <button v-for="day in data.days" :key="day.id" type="button"
            class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
            :class="{ 'bg-primary/5': selectedDayId === day.id }" @click="selectedDayId = day.id">
            <span class="min-w-0">
              <span class="block font-medium">{{ formatDate(day.year, day.month, day.day) }}</span>
              <span class="mt-0.5 block truncate text-xs text-muted-foreground">Kok: {{ day.cook.name }}</span>
            </span>
            <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
              :class="day.registration ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'">
              {{ day.registration ? "Ingevuld" : "Open" }}
            </span>
          </button>
          <div class="flex justify-center p-3">
            <UiButton v-if="data.hasMore" type="button" variant="outline" :disabled="loadingMore" @click="loadMoreDays">
              <Icon :name="loadingMore ? 'svg-spinners:180-ring' : 'lucide:chevron-down'" class="mr-2 size-4" />
              {{ loadingMore ? "Laden..." : "Laad oudere kookdagen" }}
            </UiButton>
            <p v-else class="text-xs text-muted-foreground">Alle kookdagen geladen</p>
          </div>
        </div>
        <div v-else class="px-4 py-8 text-center">
          <Icon name="lucide:calendar-x-2" class="mx-auto size-8 text-muted-foreground" />
          <p class="mt-3 text-sm font-medium">Geen kookdagen gevonden</p>
          <p class="mt-1 text-xs text-muted-foreground">Er zijn geen kookdagen in deze periode.</p>
          <UiButton v-if="data.hasMore" type="button" variant="outline" class="mt-4" :disabled="loadingMore"
            @click="loadMoreDays">
            <Icon :name="loadingMore ? 'svg-spinners:180-ring' : 'lucide:chevron-down'" class="mr-2 size-4" />
            {{ loadingMore ? "Laden..." : "Laad oudere kookdagen" }}
          </UiButton>
        </div>
      </section>

      <section v-if="selectedDay" class="rounded-xl border bg-card shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 class="font-semibold">{{ formatDate(selectedDay.year, selectedDay.month, selectedDay.day) }}</h2>
            <p class="mt-1 text-sm text-muted-foreground">Kok: {{ selectedDay.cook.name }}</p>
          </div>
          <span class="rounded-full bg-muted px-3 py-1 text-xs font-medium">{{ data.group.name }}</span>
        </div>

        <form class="space-y-6 p-5" @submit.prevent="saveRegistration">
          <div class="space-y-3">
            <div>
              <h3 class="text-sm font-semibold">Afwassers</h3>
              <p class="mt-1 text-xs text-muted-foreground">Eén afwasser krijgt beide afwaspunten.</p>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <UiCheckbox v-model:checked="twoWashers" />
              Twee verschillende afwassers
            </label>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="grid gap-1.5 text-sm">
                <UiLabel>{{ twoWashers ? "Afwasser 1" : "Afwasser" }}</UiLabel>
                <UiSelect :model-value="washUserOneId === undefined ? undefined : String(washUserOneId)"
                  @update:model-value="washUserOneId = Number($event)">
                  <UiSelectTrigger placeholder="Kies een afwasser" />
                  <UiSelectContent>
                    <UiSelectItem v-for="washer in data.washers" :key="washer.id" :value="String(washer.id)"
                      :text="washer.name" />
                  </UiSelectContent>
                </UiSelect>
              </div>
              <div v-if="twoWashers" class="grid gap-1.5 text-sm">
                <UiLabel>Afwasser 2</UiLabel>
                <UiSelect :model-value="washUserTwoId === undefined ? undefined : String(washUserTwoId)"
                  @update:model-value="washUserTwoId = Number($event)">
                  <UiSelectTrigger placeholder="Kies een afwasser" />
                  <UiSelectContent>
                    <UiSelectItem v-for="washer in data.washers" :key="washer.id" :value="String(washer.id)"
                      :text="washer.name" />
                  </UiSelectContent>
                </UiSelect>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <h3 class="text-sm font-semibold">Mee-eters</h3>
              <p class="mt-1 text-xs text-muted-foreground">Vink iedereen aan die mee-eet. De standaardhoeveelheid is 1
                persoon.</p>
            </div>
            <div v-if="data.members.length" class="divide-y rounded-lg border">
              <div v-for="member in data.members" :key="member.id" class="flex items-center gap-3 px-3 py-2.5">
                <UiCheckbox :checked="eaterAmounts[member.id] !== undefined" :aria-label="`${member.name} eet mee`"
                  @update:checked="toggleEater(member.id, $event)" />
                <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ member.name }}</span>
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Aantal</span>
                  <UiInput v-if="eaterAmounts[member.id] !== undefined" v-model.number="eaterAmounts[member.id]"
                    type="number" min="1" step="1" class="h-9 w-20 px-2 text-sm"
                    :aria-label="`Aantal mee-eters voor ${member.name}`" />
                  <span v-else class="w-20 text-center">—</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p class="text-xs text-muted-foreground">Iedereen uit je kookgroep kan dit namens jou invullen.</p>
            <UiButton type="submit" :disabled="saving || data.members.length === 0">
              <Icon :name="saving ? 'svg-spinners:180-ring' : 'lucide:save'" class="mr-2 size-4" />
              {{ saving ? "Opslaan..." : "Afwas opslaan" }}
            </UiButton>
          </div>
        </form>
      </section>

      <section v-else class="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
        Selecteer links een kookdag om de afwas in te vullen.
      </section>
      </div>
    </div>
    <p v-if="loadError" class="text-sm text-destructive">{{ loadError }}</p>
  </div>
</template>

<script setup lang="ts">
import type { WashingFillDto } from "~/types/dto";

usePageInfoStore().setPageInfo({ title: "Afwas invullen" });
useSeoMeta({ title: "Afwas invullen" });

const { data, error, refresh } = await useAPI<WashingFillDto>("/api/washing/fill");
const selectedDayId = ref<number | null>(null);
const washUserOneId = ref<number | undefined>();
const washUserTwoId = ref<number | undefined>();
const twoWashers = ref(false);
const eaterAmounts = reactive<Record<number, number | undefined>>({});
const saving = ref(false);
const loadingMore = ref(false);
const loadError = ref("");

const selectedDay = computed(() => data.value?.days.find((day) => day.id === selectedDayId.value));
const standings = computed(() =>
  [...(data.value?.members ?? [])].sort(
    (a, b) => a.washingpoints - b.washingpoints || a.name.localeCompare(b.name)
  )
);
const formatPoints = (points: number) => points.toFixed(1);
const formatDate = (year: number, month: number, day: number) => {
  const formatted = new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "2-digit"
  }).format(new Date(year, month - 1, day));

  const capitalised = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  return capitalised.replace(/\s(\d{2})$/, " '$1");
}

watch(
  data,
  (value) => {
    if (value?.days.length && !value.days.some((day) => day.id === selectedDayId.value)) {
      selectedDayId.value = value.days[0]!.id;
    }
  },
  { immediate: true }
);

watch(selectedDay, (day) => {
  Object.keys(eaterAmounts).forEach((id) => delete eaterAmounts[Number(id)]);
  if (!day) return;

  const registration = day.registration;
  washUserOneId.value = registration?.washUserOneId ?? data.value?.members[0]?.id;
  washUserTwoId.value = registration?.washUserTwoId ?? washUserOneId.value;
  twoWashers.value = !!registration && registration.washUserOneId !== registration.washUserTwoId;
  registration?.eaters.forEach(({ userId, amountEat }) => {
    eaterAmounts[userId] = amountEat;
  });
}, { immediate: true });

const toggleEater = (userId: number, checked: boolean) => {
  eaterAmounts[userId] = checked ? 1 : undefined;
};

const loadMoreDays = async () => {
  if (!data.value?.hasMore || data.value.nextCursor === null || loadingMore.value) return;

  loadingMore.value = true;
  loadError.value = "";
  try {
    const { $api } = useNuxtApp();
    const nextPage = await $api<WashingFillDto>(
      `/api/washing/fill?after=${data.value.nextCursor}`
    );
    data.value.days.push(...nextPage.days);
    data.value.hasMore = nextPage.hasMore;
    data.value.nextCursor = nextPage.nextCursor;
  } catch (cause) {
    const requestError = cause as { data?: { statusMessage?: string }; statusMessage?: string };
    loadError.value =
      requestError.data?.statusMessage ??
      requestError.statusMessage ??
      "Oudere kookdagen konden niet worden geladen.";
    useSonner.error(loadError.value);
  } finally {
    loadingMore.value = false;
  }
};

const loadWhenNearBottom = (event: Event) => {
  const element = event.currentTarget as HTMLElement;
  if (element.scrollHeight - element.scrollTop - element.clientHeight < 80) {
    void loadMoreDays();
  }
};

const saveRegistration = async () => {
  if (!selectedDay.value || washUserOneId.value === undefined) return;
  if (twoWashers.value && washUserTwoId.value === undefined) return;
  if (Object.values(eaterAmounts).some((amount) => amount !== undefined && (!Number.isInteger(amount) || amount < 1))) {
    useSonner.error("Het aantal mee-eters moet minimaal 1 zijn.");
    return;
  }

  saving.value = true;
  try {
    const { error: saveError } = await useAPI("/api/washing/fill", {
      method: "POST",
      body: {
        assignedDayId: selectedDay.value.id,
        washUserOneId: washUserOneId.value,
        washUserTwoId: twoWashers.value ? washUserTwoId.value : washUserOneId.value,
        eaters: Object.entries(eaterAmounts)
          .filter(([, amount]) => amount !== undefined)
          .map(([userId, amountEat]) => ({ userId: Number(userId), amountEat })),
      },
    });
    if (saveError.value) {
      useSonner.error(saveError.value.statusMessage ?? "De afwas kon niet worden opgeslagen.");
      return;
    }
    await refresh();
    useSonner.success("Afwas opgeslagen.");
  } catch (cause) {
    const requestError = cause as { data?: { statusMessage?: string }; statusMessage?: string };
    useSonner.error(requestError.data?.statusMessage ?? requestError.statusMessage ?? "De afwas kon niet worden opgeslagen.");
  } finally {
    saving.value = false;
  }
};
</script>
