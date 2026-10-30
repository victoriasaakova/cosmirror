import type { FormEvent } from "react";
import type { PersonDraft, RelationshipKind, RelationshipStage } from "@/lib/compatibility/types";
import { PersonCard } from "@/components/compatibility/PersonCard";
import { glassFrameClass, goldButtonClass } from "@/components/compatibility/styles";

const RELATIONSHIP_KINDS: { id: RelationshipKind; label: string }[] = [
  { id: "friendship", label: "дружеские" },
  { id: "romantic", label: "романтические" },
  { id: "family", label: "семейные" },
];

const RELATIONSHIP_STAGES: { id: RelationshipStage; label: string }[] = [
  { id: "meeting", label: "начало знакомства" },
  { id: "together", label: "в отношениях" },
  { id: "past", label: "партнёр из прошлого" },
];

type Props = {
  people: [PersonDraft, PersonDraft];
  relationshipKind: RelationshipKind | null;
  relationshipStage: RelationshipStage | null;
  disabled?: boolean;
  error?: string;
  onChange: (next: PersonDraft) => void;
  onRelationshipKind: (kind: RelationshipKind) => void;
  onRelationshipStage: (stage: RelationshipStage) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function ChoicePills<T extends string>({
  label,
  labelId,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  labelId: string;
  value: T | null;
  options: { id: T; label: string }[];
  disabled?: boolean;
  onChange: (id: T) => void;
}) {
  return (
    <div className="mt-8 md:text-center">
      <p id={labelId} className="text-xl text-white md:text-2xl">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="mt-4 flex flex-wrap gap-2 md:justify-center">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border bg-transparent px-[1.1rem] py-[0.4rem] text-base leading-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6E7A1] disabled:opacity-60 ${
                selected
                  ? "border-[#F6E7A1] text-[#F6E7A1]"
                  : "border-white/15 text-white/60 hover:border-[#F6E7A1]/70 hover:text-[#F6E7A1]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CoupleInput({
  people,
  relationshipKind,
  relationshipStage,
  disabled = false,
  error = "",
  onChange,
  onRelationshipKind,
  onRelationshipStage,
  onSubmit,
}: Props) {
  return (
    <section
      id="compatibility-check"
      className="mt-16 w-full scroll-mt-28 sm:mt-20"
      aria-labelledby="check-title"
    >
      <div className={`${glassFrameClass} px-4 py-7 sm:px-7 sm:py-9 md:px-8 md:py-10`}>
        <h2
          id="check-title"
          className="text-center text-3xl font-normal leading-tight tracking-tight text-white md:text-5xl"
        >
          Ваша <span className="font-display italic text-[#F6E7A1]">совместимость</span>
        </h2>

        <form onSubmit={onSubmit} className="mt-8 md:mt-10">
          <div className="grid items-start gap-4 md:grid-cols-2 md:gap-5">
            <PersonCard person={people[0]} disabled={disabled} onChange={onChange} />
            <PersonCard person={people[1]} disabled={disabled} onChange={onChange} />
          </div>

          <ChoicePills
            label="Тип отношений"
            labelId="relationship-kind"
            value={relationshipKind}
            options={RELATIONSHIP_KINDS}
            disabled={disabled}
            onChange={onRelationshipKind}
          />

          {relationshipKind === "romantic" ? (
            <ChoicePills
              label="Статус отношений"
              labelId="relationship-stage"
              value={relationshipStage}
              options={RELATIONSHIP_STAGES}
              disabled={disabled}
              onChange={onRelationshipStage}
            />
          ) : null}

          {error ? (
            <p className="mt-6 text-center text-sm text-[#F6E7A1]" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-14 flex justify-center sm:mt-16">
            <button type="submit" disabled={disabled} className={goldButtonClass}>
              {disabled ? "Собираем…" : "Посмотреть результат"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
