import type { PersonDraft, RelationshipKind, RelationshipStage } from "@/lib/compatibility/types";

/**
 * Пара для /dev/compatibility/. Координаты — первый ответ geo suggest,
 * тот же выбор, что даёт клик по первой подсказке в форме.
 */
export const DEV_COMPATIBILITY_PRESET: {
  relationshipKind: RelationshipKind;
  relationshipStage: RelationshipStage;
  people: [PersonDraft, PersonDraft];
} = {
  relationshipKind: "romantic",
  relationshipStage: "together",
  people: [
    {
      id: "A",
      displayName: "Виктория",
      birthDate: "12.04.1994",
      birthTime: "14:30",
      unknownTime: false,
      placeName: "Москва, Россия",
      latitude: 55.625578,
      longitude: 37.6063916,
      timezone: "Europe/Moscow",
    },
    {
      id: "B",
      displayName: "Марк",
      birthDate: "03.11.1991",
      birthTime: "",
      unknownTime: true,
      placeName: "Казань, Россия",
      latitude: 55.7946485,
      longitude: 49.1115022,
      timezone: "Europe/Moscow",
    },
  ],
};
