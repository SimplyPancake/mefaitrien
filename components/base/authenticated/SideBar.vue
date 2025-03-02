<template>
	<UiSidebarProvider>
		<UiSidebar>
			<UiSidebarContent>
				<UiSidebarGroup>
					<div class="flex flex-row items-center gap-4">
						<UiAvatar src="/img/logo.png" class="size-16 rounded-none" />
						<div class="text-lg font-bold">
							Me Fait Rien
						</div>
					</div>
				</UiSidebarGroup>
				<UiSidebarGroup>
					<UiDivider class="text-primary" />
				</UiSidebarGroup>
				<UiSidebarGroup>
					<UiSidebarGroupContent>
						<UiSidebarMenu>
							<UiSidebarMenuItem v-for="item in items" :key="item.title">
								<UiSidebarMenuButton as-child>
									<NuxtLink :to="item.url">
										<Icon :name="item.icon" style="color: var(--primary)" class="size-4" />
										<span class="font-medium text-lg">{{ item.title }}</span>
									</NuxtLink>
								</UiSidebarMenuButton>
								<UiSidebarMenuSubItem v-for="(child, k) in item.items" :key="`child-${k}`">
									<UiSidebarMenuSubButton as-child>
										<NuxtLink :href="child.url">
											{{ child.title }}
										</NuxtLink>
									</UiSidebarMenuSubButton>
								</UiSidebarMenuSubItem>
							</UiSidebarMenuItem>
						</UiSidebarMenu>
					</UiSidebarGroupContent>
				</UiSidebarGroup>

				<!-- Sidebar footer -->
				<UiSidebarFooter class="mt-auto mb-5">
					<div class="flex items-center flex-row gap-4">
						<UiAvatar src="/img/dannyprofielfoto.png" class="size-16" />
						<div class="font-medium basis-1/2">
							<div>{{ data?.name! }}</div>
							<div class="text-sm text-gray-500">{{ data.cookingGroup ?? "Geen kookgroep" }}</div>
						</div>
						<UiDropdownMenu class="basis-1/6">
							<UiDropdownMenuTrigger as-child>
								<UiButton size="icon" variant="outline">
									<Icon class="size-4" name="lucide:user" />
								</UiButton>
							</UiDropdownMenuTrigger>
							<UiDropdownMenuContent class="w-56">
								<template v-for="(item, i) in settingsItems" :key="i">
									<UiDropdownMenuLabel v-if="item.label" :label="item.label" />
									<UiDropdownMenuSeparator v-else-if="item.divider" />
									<UiDropdownMenuItem v-else-if="item.title" :title="item.title" :icon="item.icon"
										@click="item.click" />
								</template>
							</UiDropdownMenuContent>
						</UiDropdownMenu>
					</div>
				</UiSidebarFooter>
			</UiSidebarContent>
		</UiSidebar>
		<UiSidebarInset>
			<!-- TODO: Navbar online on mobile -->
			<!-- <UiNavbar sticky>
				<UiContainer class="flex h-12 items-center">
					<UiSidebarTrigger />
				</UiContainer>
			</UiNavbar> -->
			<div class="p-5 bg-transparent text-foreground">
				<slot />
			</div>
		</UiSidebarInset>
	</UiSidebarProvider>
</template>

<script lang="ts" setup>
import { UiDropdownMenu, UiDropdownMenuContent, UiDropdownMenuItem, UiDropdownMenuLabel, UiDropdownMenuSeparator, UiDropdownMenuTrigger, UiSidebarGroupLabel, UiSidebarMenuSubItem } from '#components';
const { data, signOut } = useAuth();
import { Role } from "@prisma/client"
const colorMode = useColorMode()

const changeColors = () => {
	colorMode.preference = colorMode.preference == "light" ? "dark" : "light"
}


// Menu items.
const items = [
	{ title: "Home", url: "/", icon: "lucide:home" },
	{
		title: "Koken", url: "/cooking", icon: "lucide:cooking-pot", items: [
			{ title: "Invullen", url: "#" },
			{ title: "Aanmaken", url: "/cooking/create" },
		]
	},
	{ title: "Calendar", url: "#", icon: "lucide:calendar" },
	{ title: "Search", url: "#", icon: "lucide:search" },
	{ title: "Settings", url: "#", icon: "lucide:settings" },
];

// Settings items
const settingsItems = [
	{ label: "Mijn account" },
	{ divider: true },
	{ title: "Instellingen", icon: "lucide:settings", click: () => navigateTo('/settings') },
	{ title: "Verander kleurmodus", icon: "lucide:paintbrush", click: () => changeColors() },
	{ divider: true },
	{ title: "Uitloggen", icon: "lucide:log-out", click: () => signOut({ callbackUrl: '/auth/login' }) },
];

if (data && data.value!.role! == Role.ADMIN) {
	// Kookrooster maken naar andere rol?

	settingsItems.push({ divider: true });
	settingsItems.push({ title: "Admin instellingen", icon: "lucide:shield-ellipsis", click: () => navigateTo('/admin') });
}

</script>
