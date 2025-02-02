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
          <div class="flex items-center gap-4">
            <UiAvatar src="/img/dannyprofielfoto.png" class="size-16" />
            <div class="font-medium">
              <div>{{ data.username }}</div>
              <div class="text-sm text-gray-500">{{ data.cookingGroup ?? "Geen kookgroep" }}</div>
              <div v-if="data.role == Role.ADMIN" class="text-sm text-gray-500">
                Ingelogd als Admin
              </div>
            </div>
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
import { UiSidebarGroupLabel } from '#components';
const { data } = useAuth();
import { Role } from "@prisma/client"

// Menu items.
const items = [
  { title: "Home", url: "#", icon: "lucide:home" },
  { title: "Koken", url: "#", icon: "lucide:cooking-pot" },
  { title: "Calendar", url: "#", icon: "lucide:calendar" },
  { title: "Search", url: "#", icon: "lucide:search" },
  { title: "Settings", url: "#", icon: "lucide:settings" },
];
</script>
