<template>
	<UiDialog v-model:open="opened">
		<UiDialogContent class="sm:max-w-[425px]" :title="`Laat iemand koken op ${selectedDate}`">
			<template #content>
				<UiListbox :highlight-on-hover="false" v-model="selected">
					<UiListboxContent>
						<template v-for="avail in availabilityGroups" :key="avail.availability">
							<UiListboxGroup class="animate-fadeIn">
								<UiListboxGroupLabel>{{ availabilityTranslations[avail.availability] }}
								</UiListboxGroupLabel>
								<template v-for="p in avail.people" :key="p.id">
									<UiListboxItem :value="p" class="mb-1">
										<div class="flex items-center gap-5">
											<UiAvatar src="/img/dannyprofielfoto.png" class="size-8" />
											<div class="text-sm">
												<p class="font-medium">{{ p.name }}</p>
											</div>
										</div>
									</UiListboxItem>
								</template>
							</UiListboxGroup>
						</template>
					</UiListboxContent>
				</UiListbox>
			</template>
			<template #footer>
				<UiDialogFooter>
					<UiButton variant="outline" type="button" class="mt-2 sm:mt-0" @click="closeDialog(false)">
						Laat maar</UiButton>
					<UiButton type="submit" @click="closeDialog(true)">Opslaan</UiButton>
				</UiDialogFooter>
			</template>
		</UiDialogContent>
	</UiDialog>
</template>

<script lang="ts" setup>
import type { GroupUsersDto } from '~/types/dto';
import { AvailabilityType } from "@prisma/client";
import { availabilityTranslations } from "~/i18n/enumTranslations";

const opened = ref(false);
const selected = ref<PersonSmall>();

type PersonSmall = {
	id: Number,
	name: String
}
type AvailabilityGroup = {
	availability: AvailabilityType,
	people: Array<PersonSmall>;
}

const props = defineProps<{
	selectedDateString: string,
	groupInfo: GroupUsersDto[];
}>()

const emit = defineEmits<{
	(e: 'savePerson', selectedPerson: PersonSmall, selectedDateString: String): void
}>();

const AVAILABILITY_ORDER: AvailabilityType[] = [
	'POSITIVE',
	'AVAILABLE',
	'NEGATIVE',
	'UNAVAILABLE',
];

const availabilityGroups = computed<AvailabilityGroup[]>(() => {
	const availMap = new Map<AvailabilityType, AvailabilityGroup>();

	props.groupInfo.forEach(group => {
		group.people.forEach(person => {
			//TODO: Not filled in means available  on backend!
			const availability = person.availability || 'UNAVAILABLE';
			if (!availMap.has(availability)) {
				availMap.set(availability, {
					availability,
					people: []
				});
			}
			availMap.get(availability)?.people.push({
				id: person.id,
				name: person.name
			});
		});
	});

	const values = Array.from(availMap.values());
	values.sort((a, b) => AVAILABILITY_ORDER.indexOf(a.availability) - AVAILABILITY_ORDER.indexOf(b.availability));
	return values;
});

const openDialog = () => {
	selected.value = undefined;
	opened.value = true;
}

defineExpose({
	opened,
	openDialog,
	selected
})

const closeDialog = (save: boolean) => {
	opened.value = false;

	if (save) {
		emit("savePerson", selected.value!, props.selectedDateString)
	}
};

const selectedDate = computed(() => {
	return new Date(props.selectedDateString).toLocaleDateString('nl-NL', {
		day: 'numeric',
		month: 'long'
	})
})
</script>

<style></style>