<template>
  <UiCard class="w-100" title="Wie zitten er allemaal in het huis?">
    <template #content>
      <UiCardContent>
        <UiListbox :highlight-on-hover="false">
          <UiListboxFilter v-model="search" placeholder="Zoeken..." />
          <UiListboxContent>
            <template v-for="group in filteredGroups" :key="group.id">
              <UiListboxGroup>
                <UiListboxGroupLabel>{{ group.name }}</UiListboxGroupLabel>
                <template v-if="group.people.length > 0">
                  <template v-for="p in group.people" :key="p.id">
                    <UiListboxItem :value="p">
                      <div class="flex items-center gap-5">
                        <UiAvatar src="/img/dannyprofielfoto.png" class="size-8" />
                        <div class="text-sm">
                          <p class="font-medium">{{ p.name }}</p>
                        </div>
                      </div>
                    </UiListboxItem>
                  </template>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center py-5 text-sm font-medium">
                    <p>Er zijn geen mensen met die naam</p>
                  </div>
                </template>
              </UiListboxGroup>
            </template>
          </UiListboxContent>
        </UiListbox>
      </UiCardContent>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useAPI } from "~/composables/useAPI";

// Mock groups and people
type Person = { id: string, name: string, points: number }
type Group = { id: string, name: string, people: Person[] }

const groups = ref<Group[]>([]);

const { data, error } = await useAPI<Group[]>('/api/cooking/users', {
  method: 'GET',
});

if (data.value) {
  groups.value = data.value;
} else {
  console.error(error.value?.statusMessage);
}

const search = ref("");
const selected = ref<Person | null>(null);

const filteredGroups = computed(() => {
  if (!search.value) return groups.value;
  return groups.value.map(group => ({
    ...group,
    people: group.people.filter(p => p.name.toLowerCase().includes(search.value.toLowerCase()))
  }));
});
</script>

<style></style>