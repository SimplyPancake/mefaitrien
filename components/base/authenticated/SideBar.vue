<template>
  <UiSidebarProvider>
    <UiSidebar>
      <UiSidebarContent>
        <UiSidebarGroup>
          <UiSidebarGroupLabel label="Me Fait Rien 47" />
          <UiSidebarGroupContent>
            <UiSidebarMenu>
              <UiSidebarMenuItem v-for="item in items" :key="item.title">
                <UiSidebarMenuButton as-child>
                  <NuxtLink :to="item.url">
                    <Icon :name="item.icon" />
                    <span>{{ item.title }}</span>
                  </NuxtLink>
                </UiSidebarMenuButton>
              </UiSidebarMenuItem>
            </UiSidebarMenu>
          </UiSidebarGroupContent>
        </UiSidebarGroup>

        <!-- Sidebar footer -->
        <UiSidebarFooter class="mt-auto mb-5">
          <div class="flex items-center flex-row gap-4">
            <UiAvatar src="/img/dannyprofielfoto.png" class="size-16" />
            <div class="font-medium basis-1/2">
              <div>{{ data.name }}</div>
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
                  <UiDropdownMenuItem v-else-if="item.title" 
                  :title="item.title"
                  :icon="item.icon"
                  @click="item.click"/>
                </template>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </div>
        </UiSidebarFooter>
      </UiSidebarContent>
    </UiSidebar>
    <UiSidebarInset>
      <UiNavbar sticky>
        <UiContainer class="flex h-12 items-center">
          <UiSidebarTrigger />
          <slot />
        </UiContainer>
      </UiNavbar>
    </UiSidebarInset>
  </UiSidebarProvider>
</template>

<script lang="ts" setup>
import { UiDropdownMenu, UiDropdownMenuContent, UiDropdownMenuItem, UiDropdownMenuLabel, UiDropdownMenuSeparator, UiDropdownMenuTrigger, UiSidebarGroupLabel } from '#components';
const { data, signOut } = useAuth();
import { Role } from "@prisma/client"

// Menu items.
const items = [
  { title: "Home", url: "#", icon: "lucide:home" },
  { title: "Koken", url: "#", icon: "lucide:cooking-pot" },
  { title: "Calendar", url: "#", icon: "lucide:calendar" },
  { title: "Search", url: "#", icon: "lucide:search" },
  { title: "Settings", url: "#", icon: "lucide:settings" },
];

// Settings items
const settingsItems = [
  { label: "Mijn account" },
  { divider: true },
  { title: "Instellingen", icon: "lucide:settings", click: () => navigateTo('/settings') },
  { divider: true },
  { title: "Uitloggen", icon: "lucide:log-out", click: () => signOut({callbackUrl: '/auth/login'}) },
]

if (data.value.role == Role.ADMIN) {
  settingsItems.push({ divider: true });
  settingsItems.push({ title: "Admin instellingen", icon: "lucide:shield-ellipsis", click: () => navigateTo('/admin') });
}

</script>
