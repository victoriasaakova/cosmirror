"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  createOnboardingSession,
  fetchOnboardingInsight,
  fetchOnboardingSession,
  submitOnboardingStep,
  suggestPlaces,
  type OnboardingInsight,
  type PlaceSuggestion,
} from "@/lib/api";

const SESSION_KEY = "cosmirror.onboarding.token";

type Gender = "female" | "male" | "";
type AgeRange = "18-24" | "25-34" | "35-44" | "45+" | "";
type LifeStage =
  | "stable"
  | "one-sphere"
  | "many-spheres"
  | "ready-to-change"
  | "unclear"
  | "";
type FocusArea =
  | "love"
  | "money"
  | "energy"
  | "confidence"
  | "path"
  | "other";
type Intent =
  | "future"
  | "potential"
  | "uncertainty"
  | "relationships"
  | "patterns"
  | "life-stage"
  | "other"
  | "";
type ChartKnowledge =
  | "sun-only"
  | "big-three"
  | "natal-chart"
  | "transits"
  | "";
type AstrologyTrigger =
  | "understand-self"
  | "person"
  | "decision"
  | "check-feelings"
  | "curious"
  | "";

type Answers = {
  name: string;
  gender: Gender;
  age: AgeRange;
  lifeStage: LifeStage;
  focus: FocusArea[];
  intent: Intent;
  chartKnowledge: ChartKnowledge;
  astrologyTrigger: AstrologyTrigger;
};

type BirthAnswers = {
  birth_date: string;
  birth_place: string;
  birth_time: string;
  unknown_time: boolean;
  birth_lat: number | null;
  birth_lng: number | null;
  timezone: string;
};

type ContactsAnswers = {
  email: string;
  phone: string;
  telegram: string;
};

type Phase = "questions" | "birth" | "contacts" | "insight";

const STEPS = [
  "name",
  "gender",
  "age",
  "lifeStage",
  "focus",
  "intent",
  "chartKnowledge",
  "astrologyTrigger",
] as const;
type Step = (typeof STEPS)[number];

const GENDERS: { value: Exclude<Gender, "">; label: string }[] = [
  { value: "female", label: "Женский" },
  { value: "male", label: "Мужской" },
];

const AGES: { value: Exclude<AgeRange, "">; label: string }[] = [
  { value: "18-24", label: "18–24" },
  { value: "25-34", label: "25–34" },
  { value: "35-44", label: "35–44" },
  { value: "45+", label: "45+" },
];

const LIFE_STAGES: { value: Exclude<LifeStage, "">; label: string }[] = [
  { value: "stable", label: "все довольно стабильно" },
  { value: "one-sphere", label: "меняется одна важная сфера" },
  { value: "many-spheres", label: "перестройки в нескольких сферах жизни" },
  { value: "ready-to-change", label: "чувствую, что пора что-то менять" },
  { value: "unclear", label: "пока не понимаю, что происходит" },
];

const FOCUS_AREAS: { value: FocusArea; label: string }[] = [
  { value: "love", label: "отношения и любовь" },
  { value: "money", label: "деньги и работа" },
  { value: "energy", label: "энергия, ресурсы и восстановление" },
  { value: "confidence", label: "самооценка и уверенность" },
  { value: "path", label: "самореализация и поиск своего пути" },
  { value: "other", label: "другое" },
];

const INTENTS: { value: Exclude<Intent, "">; label: string }[] = [
  { value: "future", label: "узнать, что меня ждёт в ближайшем будущем" },
  { value: "potential", label: "понять себя и свой потенциал" },
  { value: "uncertainty", label: "найти выход из неопределённости" },
  { value: "relationships", label: "наладить отношения" },
  { value: "patterns", label: "понять закономерности своей жизни" },
  { value: "life-stage", label: "разобраться в текущем жизненном этапе" },
  { value: "other", label: "другое" },
];

const CHART_KNOWLEDGE: { value: Exclude<ChartKnowledge, "">; label: string }[] = [
  { value: "sun-only", label: "Только знак зодиака" },
  { value: "big-three", label: "Знак, луна или асцендент" },
  { value: "natal-chart", label: "Читаю свою натальную карту" },
  { value: "transits", label: "Разбираюсь в транзитах" },
];

const ASTROLOGY_TRIGGERS: { value: Exclude<AstrologyTrigger, "">; label: string }[] = [
  { value: "understand-self", label: "Хочу понять, что со мной происходит" },
  { value: "person", label: "Не складывается с конкретным человеком" },
  { value: "decision", label: "Нужно принять решение" },
  { value: "check-feelings", label: "Хочу проверить свои ощущения" },
  { value: "curious", label: "Просто интересно" },
];

const PLANET_LABELS: Record<string, string> = {
  sun: "Солнце",
  moon: "Луна",
  mercury: "Меркурий",
  venus: "Венера",
  mars: "Марс",
  jupiter: "Юпитер",
  saturn: "Сатурн",
};

function canContinue(step: Step, answers: Answers) {
  if (step === "name") return answers.name.trim().length > 0;
  if (step === "gender") return answers.gender !== "";
  if (step === "age") return answers.age !== "";
  if (step === "lifeStage") return answers.lifeStage !== "";
  if (step === "focus") return answers.focus.length > 0;
  if (step === "intent") return answers.intent !== "";
  if (step === "chartKnowledge") return answers.chartKnowledge !== "";
  return answers.astrologyTrigger !== "";
}

/** Маска ввода дд.мм.гггг — точки ставятся сами. */
function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}.${month}`;
  return `${day}.${month}.${year}`;
}
function toIsoDate(value: string): string | null {
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
      return null;
    }
    return v;
  }
  const match = v.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** Всегда держит префикс `+`, дальше только цифры. */
function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 15);
  return `+${digits}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function canSubmitContacts(contacts: ContactsAnswers) {
  return Boolean(
    contacts.telegram.trim() &&
      isValidPhone(contacts.phone) &&
      isValidEmail(contacts.email),
  );
}

function labelFor(options: { value: string; label: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? "";
}

function choiceClass(active: boolean) {
  return `w-full rounded-[1.35rem] border px-5 py-4 text-left font-display text-lg leading-snug transition-all sm:text-xl ${
    active
      ? "border-[#ff7b36]/70 bg-[#ff7b36]/15 text-white shadow-[0_0_28px_rgba(255,123,54,0.18)]"
      : "border-white/15 bg-white/[0.03] text-white/75 hover:border-white/30 hover:text-white"
  }`;
}

function fieldClass() {
  return "mt-3 w-full border-b border-white/20 bg-transparent pb-3 font-display text-xl text-white outline-none placeholder:text-white/30 focus:border-[#ff7b36] sm:text-2xl [color-scheme:dark]";
}

async function ensureSessionToken(): Promise<string> {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) {
      try {
        await fetchOnboardingSession(existing);
        return existing;
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }
  const session = await createOnboardingSession();
  localStorage.setItem(SESSION_KEY, session.token);
  return session.token;
}

export function OnboardingFlow() {
  const [phase, setPhase] = useState<Phase>("questions");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    name: "",
    gender: "",
    age: "",
    lifeStage: "",
    focus: [],
    intent: "",
    chartKnowledge: "",
    astrologyTrigger: "",
  });
  const [birth, setBirth] = useState<BirthAnswers>({
    birth_date: "",
    birth_place: "",
    birth_time: "",
    unknown_time: false,
    birth_lat: null,
    birth_lng: null,
    timezone: "",
  });
  const [contacts, setContacts] = useState<ContactsAnswers>({
    email: "",
    phone: "+",
    telegram: "",
  });
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [insight, setInsight] = useState<OnboardingInsight | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;
  // На birth/contacts кнопку не глушим из‑за пустых полей — показываем ошибку при клике.
  const ready =
    phase === "questions"
      ? canContinue(step, answers)
      : phase === "birth" || phase === "contacts"
        ? !submitting
        : true;

  const warmSession = useCallback(async () => {
    try {
      const token = await ensureSessionToken();
      setSessionToken(token);
    } catch {
      // Сессию создадим при сабмите birth — не блокируем квиз.
    }
  }, []);

  useEffect(() => {
    void warmSession();
  }, [warmSession]);

  function goBack() {
    setError("");
    if (phase === "insight") {
      setPhase("contacts");
      return;
    }
    if (phase === "contacts") {
      setPhase("birth");
      return;
    }
    if (phase === "birth") {
      setPhase("questions");
      return;
    }
    if (isFirst) return;
    setStepIndex((current) => current - 1);
  }

  async function submitBirth() {
    if (submitting) return;
    const isoDate = toIsoDate(birth.birth_date);
    if (!isoDate) {
      setError("Укажи дату рождения в формате дд.мм.гггг");
      return;
    }
    if (birth.birth_place.trim().length < 2) {
      setError("Укажи город рождения");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const token = sessionToken ?? (await ensureSessionToken());
      setSessionToken(token);

      // Сохраняем ответы квиза на шаг welcome — бэк их кладёт в UserInput.
      await submitOnboardingStep(
        token,
        "welcome",
        {
          name: answers.name,
          gender: answers.gender,
          age: answers.age,
          life_stage: answers.lifeStage,
          focus: answers.focus,
          intent: answers.intent,
          chart_knowledge: answers.chartKnowledge,
          astrology_trigger: answers.astrologyTrigger,
        },
        true,
      );

      const payload: Record<string, unknown> = {
        birth_date: isoDate,
        birth_place: birth.birth_place.trim(),
      };
      if (!birth.unknown_time && birth.birth_time) {
        payload.birth_time = birth.birth_time;
      }
      if (birth.birth_lat != null && birth.birth_lng != null) {
        payload.birth_lat = birth.birth_lat;
        payload.birth_lng = birth.birth_lng;
      }
      if (birth.timezone) {
        payload.timezone = birth.timezone;
      }

      await submitOnboardingStep(token, "birth", payload, true);
      const data = await fetchOnboardingInsight(token);
      setInsight(data);
      // Сразу сбор контактов — инсайт только после них.
      setPhase("contacts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось построить карту");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitContacts() {
    if (submitting) return;
    if (!contacts.telegram.trim()) {
      setError("Укажи Telegram");
      return;
    }
    if (!isValidPhone(contacts.phone)) {
      setError("Укажи телефон с кодом страны, например +1 415… или +44…");
      return;
    }
    if (!isValidEmail(contacts.email)) {
      setError("Укажи корректный email");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const token = sessionToken ?? (await ensureSessionToken());
      setSessionToken(token);
      await submitOnboardingStep(
        token,
        "contacts",
        {
          email: contacts.email.trim(),
          phone: contacts.phone.trim(),
          telegram: contacts.telegram.trim(),
          name: answers.name.trim(),
          source: "onboarding",
          message: [
            answers.focus.length
              ? `Фокус: ${answers.focus.map((f) => labelFor(FOCUS_AREAS, f)).join(", ")}`
              : "",
            answers.intent ? `Цель: ${labelFor(INTENTS, answers.intent)}` : "",
            answers.lifeStage ? `Период: ${labelFor(LIFE_STAGES, answers.lifeStage)}` : "",
          ]
            .filter(Boolean)
            .join(" · "),
        },
        true,
      );

      // Если инсайт ещё не подтянули — добираем перед показом.
      if (!insight) {
        const data = await fetchOnboardingInsight(token);
        setInsight(data);
      }
      setPhase("insight");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить контакты");
    } finally {
      setSubmitting(false);
    }
  }

  function goNext(event?: FormEvent) {
    event?.preventDefault();
    if (phase === "insight") return;
    if (phase === "birth") {
      void submitBirth();
      return;
    }
    if (phase === "contacts") {
      void submitContacts();
      return;
    }
    if (!ready) return;
    if (isLast) {
      setPhase("birth");
      return;
    }
    setStepIndex((current) => current + 1);
  }

  function toggleFocus(value: FocusArea) {
    setAnswers((prev) => {
      const exists = prev.focus.includes(value);
      return {
        ...prev,
        focus: exists ? prev.focus.filter((item) => item !== value) : [...prev.focus, value],
      };
    });
  }

  // Квиз + birth + contacts (insight — результат, без точки прогресса)
  const progressCount = STEPS.length + 2;
  const progressIndex =
    phase === "questions"
      ? stepIndex
      : phase === "birth"
        ? STEPS.length
        : STEPS.length + 1;

  return (
    <main className="relative flex h-[100dvh] flex-1 flex-col overflow-hidden">
      <Image
        src="/images/cosmirror-bottom-landscape.png"
        alt=""
        fill
        priority
        className="object-cover object-bottom"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#07070c] via-[#07070c]/75 to-[#07070c]/35"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]/90"
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 md:px-8 md:pt-8">
        <div className="mx-auto flex w-full max-w-lg shrink-0 items-center justify-between">
          {phase === "questions" && isFirst ? (
            <Link
              href="/"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:border-white/30 hover:text-white"
              aria-label="На главную"
            >
              <BackIcon />
            </Link>
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 transition hover:border-white/30 hover:text-white"
              aria-label="Назад"
            >
              <BackIcon />
            </button>
          )}

          <Link
            href="/"
            className="font-display text-xl font-medium tracking-tight text-white transition hover:opacity-90"
          >
            Cosmirror
          </Link>

          <span className="w-11" aria-hidden />
        </div>

        {phase === "questions" || phase === "birth" || phase === "contacts" ? (
          <div className="mx-auto mt-8 flex w-full max-w-lg shrink-0 items-center justify-center gap-1.5">
            {Array.from({ length: progressCount }).map((_, index) => {
              const active = index === progressIndex;
              const done = index < progressIndex;
              return (
                <span
                  key={index}
                  aria-hidden
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    active
                      ? "w-7 bg-[#ff7b36]"
                      : done
                        ? "w-4 bg-[#ff7b36]/55"
                        : "w-4 bg-white/20"
                  }`}
                />
              );
            })}
          </div>
        ) : null}

        {phase === "insight" && insight ? (
          <InsightView insight={insight} answers={answers} />
        ) : (
          <form
            noValidate
            onSubmit={goNext}
            className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col pt-8 md:pt-10"
          >
            <div className="reveal min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 [-webkit-overflow-scrolling:touch]">
              {phase === "questions" && step === "name" ? (
                <NameStep
                  value={answers.name}
                  onChange={(name) => setAnswers((prev) => ({ ...prev, name }))}
                />
              ) : null}

              {phase === "questions" && step === "gender" ? (
                <GenderStep
                  value={answers.gender}
                  onChange={(gender) => setAnswers((prev) => ({ ...prev, gender }))}
                />
              ) : null}

              {phase === "questions" && step === "age" ? (
                <AgeStep
                  value={answers.age}
                  onChange={(age) => setAnswers((prev) => ({ ...prev, age }))}
                />
              ) : null}

              {phase === "questions" && step === "lifeStage" ? (
                <ChoiceStep
                  title={
                    <>
                      Какой период у тебя{" "}
                      <span className="font-display italic text-[#ff7b36]">сейчас?</span>
                    </>
                  }
                  options={LIFE_STAGES}
                  value={answers.lifeStage}
                  onChange={(lifeStage) =>
                    setAnswers((prev) => ({ ...prev, lifeStage: lifeStage as LifeStage }))
                  }
                />
              ) : null}

              {phase === "questions" && step === "focus" ? (
                <MultiChoiceStep
                  title={
                    <>
                      Какая сфера жизни сейчас волнует{" "}
                      <span className="font-display italic text-[#ff7b36]">больше всего?</span>
                    </>
                  }
                  hint="Можно выбрать несколько"
                  options={FOCUS_AREAS}
                  values={answers.focus}
                  onToggle={toggleFocus}
                />
              ) : null}

              {phase === "questions" && step === "intent" ? (
                <ChoiceStep
                  title={
                    <>
                      Какая у тебя главная цель{" "}
                      <span className="font-display italic text-[#ff7b36]">на данный момент?</span>
                    </>
                  }
                  options={INTENTS}
                  value={answers.intent}
                  onChange={(intent) =>
                    setAnswers((prev) => ({ ...prev, intent: intent as Intent }))
                  }
                />
              ) : null}

              {phase === "questions" && step === "chartKnowledge" ? (
                <ChoiceStep
                  title={
                    <>
                      Что ты уже знаешь про{" "}
                      <span className="font-display italic text-[#ff7b36]">свою карту?</span>
                    </>
                  }
                  options={CHART_KNOWLEDGE}
                  value={answers.chartKnowledge}
                  onChange={(chartKnowledge) =>
                    setAnswers((prev) => ({
                      ...prev,
                      chartKnowledge: chartKnowledge as ChartKnowledge,
                    }))
                  }
                />
              ) : null}

              {phase === "questions" && step === "astrologyTrigger" ? (
                <ChoiceStep
                  title={
                    <>
                      Что обычно приводит тебя{" "}
                      <span className="font-display italic text-[#ff7b36]">к астрологии?</span>
                    </>
                  }
                  options={ASTROLOGY_TRIGGERS}
                  value={answers.astrologyTrigger}
                  onChange={(astrologyTrigger) =>
                    setAnswers((prev) => ({
                      ...prev,
                      astrologyTrigger: astrologyTrigger as AstrologyTrigger,
                    }))
                  }
                />
              ) : null}

              {phase === "birth" ? (
                <BirthStep
                  value={birth}
                  onChange={(next) => {
                    setError("");
                    setBirth(next);
                  }}
                  error={error}
                  submitting={submitting}
                />
              ) : null}

              {phase === "contacts" ? (
                <ContactsStep
                  value={contacts}
                  onChange={(next) => {
                    setError("");
                    setContacts(next);
                  }}
                  submitting={submitting}
                />
              ) : null}
            </div>

            {error && (phase === "birth" || phase === "contacts") ? (
              <p className="mb-2 shrink-0 text-sm text-red-300" role="alert">
                {error}
              </p>
            ) : null}

            <div className="shrink-0 bg-gradient-to-t from-[#07070c] via-[#07070c]/95 to-transparent pt-3">
              <button
                type="submit"
                disabled={!ready}
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-10 py-3.5 font-display text-lg font-semibold text-black shadow-[0_12px_36px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] hover:bg-zinc-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 md:text-xl"
              >
                {phase === "birth"
                  ? submitting
                    ? "Считаем карту…"
                    : "Посмотреть карту"
                  : phase === "contacts"
                    ? submitting
                      ? "Открываем…"
                      : "Показать результат"
                    : "Продолжить"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function NameStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
        Давай познакомимся,{" "}
        <span className="font-display italic text-[#ff7b36]">как тебя зовут?</span>
      </h1>
      <label htmlFor="onboarding-name" className="sr-only">
        Имя
      </label>
      <input
        id="onboarding-name"
        type="text"
        name="name"
        autoComplete="given-name"
        autoFocus
        placeholder="Твоё имя"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-10 w-full border-b border-white/20 bg-transparent pb-3 font-display text-2xl text-white outline-none placeholder:text-white/30 focus:border-[#ff7b36] sm:text-3xl"
      />
    </div>
  );
}

function GenderStep({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (value: Gender) => void;
}) {
  return (
    <div className="flex flex-col">
      <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
        Укажи свой <span className="font-display italic text-[#ff7b36]">пол</span>
      </h1>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {GENDERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={choiceClass(value === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AgeStep({
  value,
  onChange,
}: {
  value: AgeRange;
  onChange: (value: AgeRange) => void;
}) {
  return (
    <div className="flex flex-col">
      <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
        Сколько тебе <span className="font-display italic text-[#ff7b36]">лет?</span>
      </h1>
      <div className="mt-10 grid grid-cols-2 gap-3">
        {AGES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`${choiceClass(value === option.value)} text-center`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoiceStep({
  title,
  options,
  value,
  onChange,
}: {
  title: ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        {title}
      </h1>
      <div className="mt-8 flex flex-col gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={choiceClass(value === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiChoiceStep({
  title,
  hint,
  options,
  values,
  onToggle,
}: {
  title: ReactNode;
  hint: string;
  options: { value: FocusArea; label: string }[];
  values: FocusArea[];
  onToggle: (value: FocusArea) => void;
}) {
  return (
    <div className="flex flex-col">
      <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        {title}
      </h1>
      <p className="mt-3 text-sm font-light text-white/50">{hint}</p>
      <div className="mt-8 flex flex-col gap-3">
        {options.map((option) => {
          const active = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              aria-pressed={active}
              className={choiceClass(active)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BirthStep({
  value,
  onChange,
  error,
  submitting,
}: {
  value: BirthAnswers;
  onChange: (value: BirthAnswers) => void;
  error: string;
  submitting: boolean;
}) {
  const dateInvalid = Boolean(error && !toIsoDate(value.birth_date));
  const placeInvalid = Boolean(error && value.birth_place.trim().length < 2);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);

  useEffect(() => {
    const q = value.birth_place.trim();
    if (q.length < 2 || value.birth_lat != null) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const results = await suggestPlaces(q);
        if (!cancelled) {
          setSuggestions(results);
          setSuggestOpen(results.length > 0);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setSuggestOpen(false);
        }
      } finally {
        if (!cancelled) setSuggestLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value.birth_place, value.birth_lat]);

  function pickPlace(item: PlaceSuggestion) {
    onChange({
      ...value,
      birth_place: item.place,
      birth_lat: item.latitude,
      birth_lng: item.longitude,
      timezone: item.timezone,
    });
    setSuggestions([]);
    setSuggestOpen(false);
  }

  return (
    <div className="flex flex-col">
      <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        Твоя{" "}
        <span className="font-display italic text-[#ff7b36]">натальная карта</span>
      </h1>
      <p className="mt-3 text-sm font-light leading-relaxed text-white/50">
        Введи данные рождения — посчитаем карту и покажем, что может влиять на фоне
        текущих циклов.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        <div>
          <label htmlFor="birth-date" className="text-xs uppercase tracking-[0.16em] text-white/40">
            Дата рождения
          </label>
          <input
            id="birth-date"
            type="text"
            name="birth_date"
            inputMode="numeric"
            autoComplete="bday"
            disabled={submitting}
            placeholder="дд.мм.гггг"
            maxLength={10}
            value={value.birth_date}
            onChange={(event) =>
              onChange({ ...value, birth_date: formatBirthDateInput(event.target.value) })
            }
            aria-invalid={dateInvalid}
            className={`${fieldClass()} ${dateInvalid ? "!border-[#ff7b36]" : ""}`}
          />
        </div>

        <div className="relative">
          <label htmlFor="birth-place" className="text-xs uppercase tracking-[0.16em] text-white/40">
            Город рождения
          </label>
          <input
            id="birth-place"
            type="text"
            name="birth_place"
            autoComplete="off"
            disabled={submitting}
            placeholder="Начни вводить город"
            value={value.birth_place}
            onChange={(event) =>
              onChange({
                ...value,
                birth_place: event.target.value,
                birth_lat: null,
                birth_lng: null,
                timezone: "",
              })
            }
            onFocus={() => {
              if (suggestions.length > 0) setSuggestOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setSuggestOpen(false), 150);
            }}
            aria-invalid={placeInvalid}
            aria-autocomplete="list"
            aria-expanded={suggestOpen}
            className={`${fieldClass()} ${placeInvalid ? "!border-[#ff7b36]" : ""}`}
          />
          {suggestLoading ? (
            <p className="mt-2 text-xs font-light text-white/35">Ищем города…</p>
          ) : null}
          {suggestOpen && suggestions.length > 0 ? (
            <ul
              role="listbox"
              className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-white/15 bg-[#12121a]/95 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
            >
              {suggestions.map((item) => (
                <li key={`${item.place}-${item.latitude}-${item.longitude}`}>
                  <button
                    type="button"
                    role="option"
                    className="w-full px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pickPlace(item)}
                  >
                    {item.place}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <label htmlFor="birth-time" className="text-xs uppercase tracking-[0.16em] text-white/40">
            Время рождения
          </label>
          <input
            id="birth-time"
            type="time"
            name="birth_time"
            disabled={submitting || value.unknown_time}
            value={value.unknown_time ? "" : value.birth_time}
            onChange={(event) =>
              onChange({ ...value, birth_time: event.target.value, unknown_time: false })
            }
            className={`${fieldClass()} ${value.unknown_time ? "opacity-35" : ""}`}
          />
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-white/65">
            <input
              type="checkbox"
              checked={value.unknown_time}
              disabled={submitting}
              onChange={(event) =>
                onChange({
                  ...value,
                  unknown_time: event.target.checked,
                  birth_time: event.target.checked ? "" : value.birth_time,
                })
              }
              className="mt-0.5 h-4 w-4 accent-[#ff7b36]"
            />
            <span>Не знаю точное время рождения</span>
          </label>
          {value.unknown_time ? (
            <p className="mt-2 text-xs font-light text-white/40">
              Будут Солнце и Луна. Асцендент и дома появятся, когда укажешь время.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ContactsStep({
  value,
  onChange,
  submitting,
}: {
  value: ContactsAnswers;
  onChange: (value: ContactsAnswers) => void;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-col">
      <h1 className="font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
        Твоя карта{" "}
        <span className="font-display italic text-[#ff7b36]">готова</span>
      </h1>
      <p className="mt-4 font-display text-xl leading-snug text-white/85 sm:text-2xl">
        Оставь контакты, чтобы открыть разбор
      </p>
      <p className="mt-3 text-sm font-light leading-relaxed text-white/50">
        Мы используем твои контакты только для доступа к Cosmirror, уведомлений о запуске и
        обновлений по продукту. Спамить не будем.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        <div>
          <label
            htmlFor="contact-telegram"
            className="text-xs uppercase tracking-[0.16em] text-white/40"
          >
            Telegram
          </label>
          <input
            id="contact-telegram"
            type="text"
            name="telegram"
            required
            disabled={submitting}
            placeholder="@username"
            value={value.telegram}
            onChange={(event) => onChange({ ...value, telegram: event.target.value })}
            className={fieldClass()}
          />
        </div>

        <div>
          <label htmlFor="contact-phone" className="text-xs uppercase tracking-[0.16em] text-white/40">
            Телефон
          </label>
          <input
            id="contact-phone"
            type="tel"
            name="phone"
            required
            autoComplete="tel"
            inputMode="numeric"
            disabled={submitting}
            value={value.phone || "+"}
            onChange={(event) =>
              onChange({ ...value, phone: formatPhoneInput(event.target.value) })
            }
            onFocus={(event) => {
              if (!value.phone || value.phone === "+") {
                onChange({ ...value, phone: "+" });
              }
              // Курсор после `+`
              requestAnimationFrame(() => {
                const el = event.target;
                const pos = el.value.length;
                el.setSelectionRange(pos, pos);
              });
            }}
            className={fieldClass()}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="text-xs uppercase tracking-[0.16em] text-white/40">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            disabled={submitting}
            placeholder="you@example.com"
            value={value.email}
            onChange={(event) => onChange({ ...value, email: event.target.value })}
            className={fieldClass()}
          />
        </div>
      </div>
    </div>
  );
}

function InsightView({
  insight,
  answers,
}: {
  insight: OnboardingInsight;
  answers: Answers;
}) {
  const sun = insight.natal.planets?.sun;
  const moon = insight.natal.planets?.moon;
  const asc = insight.natal.ascendant;
  const name = answers.name.trim();
  const focusLabels = answers.focus.map((f) => labelFor(FOCUS_AREAS, f)).filter(Boolean);
  const intentLabel = labelFor(INTENTS, answers.intent);
  const lifeStageLabel = labelFor(LIFE_STAGES, answers.lifeStage);

  return (
    <div className="reveal mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col overflow-y-auto pt-8 pb-4 md:pt-10">
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">Разбор</p>
      <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight text-white sm:text-4xl">
        {name ? (
          <>
            {name},{" "}
            <span className="font-display italic text-[#ff7b36]">вот что может влиять</span>
          </>
        ) : (
          <>
            Вот что может{" "}
            <span className="font-display italic text-[#ff7b36]">влиять сейчас</span>
          </>
        )}
      </h1>

      {(focusLabels.length > 0 || intentLabel || lifeStageLabel) && (
        <p className="mt-4 text-sm font-light leading-relaxed text-white/50">
          {[
            lifeStageLabel ? `Сейчас: ${lifeStageLabel}` : "",
            focusLabels.length ? `в фокусе — ${focusLabels.join(", ")}` : "",
            intentLabel ? `цель: ${intentLabel}` : "",
          ]
            .filter(Boolean)
            .join(". ")}
          . Ниже — как это пересекается с картой и текущими циклами.
        </p>
      )}

      <div className="mt-8 space-y-2 border-t border-white/10 pt-6 font-display text-lg text-white/85">
        {sun ? (
          <p>
            Солнце · <span className="text-[#ff7b36]">{sun.sign_ru}</span>
            <span className="text-white/40"> {Math.round(sun.degree)}°</span>
          </p>
        ) : null}
        {moon ? (
          <p>
            Луна · <span className="text-[#ff7b36]">{moon.sign_ru}</span>
            <span className="text-white/40"> {Math.round(moon.degree)}°</span>
            {!insight.has_birth_time ? (
              <span className="text-sm font-sans font-light text-white/40"> · ориентир</span>
            ) : null}
          </p>
        ) : null}
        {asc ? (
          <p>
            Асцендент · <span className="text-[#ff7b36]">{asc.sign_ru}</span>
            <span className="text-white/40"> {Math.round(asc.degree)}°</span>
          </p>
        ) : (
          <p className="text-sm font-sans font-light text-white/40">
            Асцендент появится, когда укажешь точное время
          </p>
        )}
      </div>

      <InsightSection title="База" items={insight.insight.base} />
      <InsightSection title="Что может влиять" items={insight.insight.influences} />
      <InsightSection title="Фон циклов" items={insight.insight.cycles} />

      {insight.natal.planets ? (
        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">Планеты</p>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            {Object.entries(insight.natal.planets)
              .filter(([key]) => PLANET_LABELS[key])
              .map(([key, body]) => (
                <li key={key} className="flex justify-between gap-4 border-b border-white/[0.06] py-2">
                  <span>{PLANET_LABELS[key]}</span>
                  <span className="text-white/90">
                    {body.sign_ru}{" "}
                    <span className="text-white/40">{Math.round(body.degree)}°</span>
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-10 text-sm font-light leading-relaxed text-white/40">
        {insight.insight.disclaimer}
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex w-full shrink-0 items-center justify-center rounded-full bg-white px-10 py-3.5 font-display text-lg font-semibold text-black shadow-[0_12px_36px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] hover:bg-zinc-100 active:scale-[0.98] md:text-xl"
      >
        На главную
      </Link>
    </div>
  );
}

function InsightSection({
  title,
  items,
}: {
  title: string;
  items: { key: string; title: string; text: string }[];
}) {
  if (!items?.length) return null;
  return (
    <section className="mt-10 border-t border-white/10 pt-6">
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">{title}</p>
      <div className="mt-5 space-y-7">
        {items.map((item) => (
          <article key={item.key}>
            <h2 className="font-display text-xl leading-snug text-white sm:text-2xl">
              {item.title}
            </h2>
            <p className="mt-2 text-[15px] font-light leading-relaxed text-white/65">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
