<template>
	<Primitive :as="as" :as-child="asChild" :class="styles({ class: props.class })">
		<slot>
			<slot name="header">
				<UiCardHeader class="px-6 pt-6 pb-2">
					<slot name="title">
						<UiCardTitle v-if="title || $slots.title" :title="title"
							class="text-xl font-bold text-primary" />
					</slot>
					<slot name="description">
						<UiCardDescription v-if="description || $slots.description" :description="description"
							class="text-muted-foreground text-base font-normal mt-1" />
					</slot>
				</UiCardHeader>
			</slot>
			<slot v-if="content || $slots.content" name="content">
				<UiCardContent class="px-6 pb-6">
					<div v-html="content" />
				</UiCardContent>
			</slot>
			<slot name="footer" />
		</slot>
	</Primitive>
</template>

<script lang="ts" setup>
import { Primitive } from "radix-vue";
import type { PrimitiveProps } from "radix-vue";

const props = withDefaults(
	defineProps<
		PrimitiveProps & {
			/** Title that should be displayed. Passed to the `CardTitle` component */
			title?: string;
			/** Description that should be displayed. Passed to the `CardDescription` component */
			description?: string;
			/** Content that should be displayed. Passed to the `CardContent` component */
			content?: string;
			/** Custom class(es) to add to the element */
			class?: any;
		}
	>(),
	{
		as: "div",
		title: undefined,
		description: undefined,
		content: undefined,
		class: undefined,
	}
);

const styles = tv({
	base: "rounded-2xl border border-card bg-card text-card-foreground shadow-lg p-0",
});
</script>
