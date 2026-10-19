import { AvailabilityType } from "@/generated/prisma/browser";
import { defineStore } from "pinia";
import { ref } from "vue";

type AvailabilityDate = {
  date: Date;
  availability?: AvailabilityType;
};

export const useCookingStore = defineStore("cooking", () => {
  const availability = ref<AvailabilityDate[]>([]);

  const setAvailability = (dates: AvailabilityDate[]) => {
    availability.value = dates;
  };

  const getAvailability = () => {
    return availability.value;
  };

  return {
    availability,
    setAvailability,
    getAvailability,
  };
});
