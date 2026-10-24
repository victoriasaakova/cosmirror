import type { FormEvent } from "react";
import type { PersonDraft } from "@/lib/compatibility/types";
import { PersonCard } from "@/components/compatibility/PersonCard";
import { goldButtonClass } from "@/components/compatibility/styles";

type Props = {
  people: [PersonDraft, PersonDraft];
  disabled?: boolean;
  error?: string;
  onChange: (next: PersonDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CoupleInput({ people, disabled = false, error = "", onChange, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 w-full max-w-5xl sm:mt-12">
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-5">
        <PersonCard person={people[0]} disabled={disabled} onChange={onChange} />
        <p
          aria-hidden
          className="py-1 text-center font-display text-3xl italic leading-[1.15] text-[#F6E7A1] md:pt-16"
        >
          и
        </p>
        <PersonCard person={people[1]} disabled={disabled} onChange={onChange} />
      </div>

      {error ? (
        <p className="mt-6 text-center text-sm text-[#F6E7A1]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex justify-center">
        <button type="submit" disabled={disabled} className={goldButtonClass}>
          {disabled ? "Собираем…" : "Исследовать совместимость"}
        </button>
      </div>
    </form>
  );
}
