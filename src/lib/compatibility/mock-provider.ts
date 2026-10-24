import type {
  CompatibilityProvider,
  CompatibilityRequest,
  CompatibilityResult,
  PersonId,
  PersonSnapshot,
  Placement,
  PointKey,
} from "@/lib/compatibility/types";

const CHART_A: Placement[] = [
  { point: "sun", sign: "gemini", degree: 5, minute: 0 },
  { point: "moon", sign: "taurus", degree: 5, minute: 50 },
  { point: "mercury", sign: "gemini", degree: 18, minute: 9, retrograde: true },
  { point: "venus", sign: "taurus", degree: 11, minute: 50 },
  { point: "mars", sign: "virgo", degree: 0, minute: 29 },
  { point: "ascendant", sign: "scorpio", degree: 19, minute: 35 },
];

const CHART_B: Placement[] = [
  { point: "sun", sign: "aquarius", degree: 25, minute: 38 },
  { point: "moon", sign: "sagittarius", degree: 4, minute: 8 },
  { point: "mercury", sign: "pisces", degree: 11, minute: 22 },
  { point: "venus", sign: "aries", degree: 9, minute: 38 },
  { point: "mars", sign: "cancer", degree: 8, minute: 41 },
  { point: "ascendant", sign: "aries", degree: 3, minute: 17 },
];

function chartOf(id: PersonId) {
  return id === "A" ? CHART_A : CHART_B;
}

function placementOf(id: PersonId, point: PointKey, knownTime: boolean) {
  if (point === "ascendant" && !knownTime) return null;
  return chartOf(id).find((item) => item.point === point) ?? null;
}

function snapshot(id: PersonId, displayName: string, birthTimeStatus: "known" | "unknown"): PersonSnapshot {
  return {
    id,
    displayName,
    birthTimeStatus,
    placements: chartOf(id).filter((item) => item.point !== "ascendant" || birthTimeStatus === "known"),
  };
}

function sameDemo(request: CompatibilityRequest) {
  const [personA, personB] = request.persons;
  return (
    personA.birthDate === "1995-05-26" &&
    (personA.birthTime ?? "").startsWith("19:25") &&
    personB.birthDate === "1993-02-14" &&
    (personB.birthTime ?? "").startsWith("08:40")
  );
}

const FIXTURE_DIMENSIONS: CompatibilityResult["dimensions"] = [
  {
    id: "emotional",
    title: "Эмоциональная связь",
    headline: "Одному нужна ясность, другому близость без спешки",
    insight:
      "Между вами может возникать разный темп тепла. Один скорее называет чувство, другой дольше остаётся в нём молча.",
    commonGround: "Вам может быть важно, чтобы рядом не притворялись спокойными.",
    tension: "Пауза одного может читаться как холод, а прямой вопрос другого как давление.",
    astroBasis: [
      "Луна одного в Тельце, Луна другого в Стрельце. Солнце одного стоит напротив Луны другого: показ себя и потребность в безопасности тянут тепло в разные стороны.",
    ],
  },
  {
    id: "communication",
    title: "Коммуникация",
    headline: "Разговор быстро становится точным и слишком плотным",
    insight:
      "Слова у вас могут сцепляться легко. Трудность не в молчании, а в том, что смысл хочется закрыть сразу.",
    commonGround: "Вам может быть интересно договаривать мысль до конца.",
    tension: "Прямота может обгонять готовность другого её услышать.",
    astroBasis: [
      "Юпитер одного в квадрате к Меркурию другого, почти вплотную. Смысл разрастается быстрее, чем его успевают сформулировать.",
    ],
  },
  {
    id: "attraction",
    title: "Притяжение и близость",
    headline: "Тяга есть, и у неё есть свой ритм",
    insight:
      "Притяжение может вспыхивать в контакте и отступать, когда темп не совпал.",
    commonGround: "Вам может быть легко чувствовать интерес друг к другу.",
    tension: "Желание близости и потребность в дистанции могут включаться в разное время.",
    astroBasis: [
      "Венера одного в секстиле к Меркурию другого, Юпитер в тригоне к Венере. Интерес может говориться вслух и расширяться, когда темп совпал.",
    ],
  },
  {
    id: "conflict",
    title: "Конфликты и напряжение",
    headline: "Спор часто идёт о скорости, а не о сути",
    insight:
      "Напряжение может собираться там, где один уже хочет решения, а другой ещё проверяет, безопасно ли его принять.",
    commonGround: "Вы можете оба замечать, когда разговор стал жёстче, чем тема.",
    tension: "Попытка быстрее закрыть тему может усиливать сопротивление.",
    astroBasis: [
      "Марс одного в квадрате к Луне другого. Скорость действия и потребность сначала почувствовать безопасность могут разминуться.",
    ],
  },
  {
    id: "growth",
    title: "Развитие и долгосрочная динамика",
    headline: "Связь держится, если темп можно называть",
    insight:
      "Долгий сюжет здесь не про одинаковость. Он про то, удаётся ли оставить разницу темпа общей темой, а не личной ошибкой.",
    commonGround: "Вам может быть куда расти, если говорить о границах до обиды.",
    tension: "Без этого разговора разница может копиться как доказательство, что вас не выбирают.",
    astroBasis: [
      "Сатурн одного в квадрате к Асценденту другого. Близость может просить больше времени и более ясных условий, чем обещает первое впечатление.",
    ],
  },
];

export const mockCompatibilityProvider: CompatibilityProvider = {
  async load(request) {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });
    return buildPreview(request);
  },
};

export function buildPreview(request: CompatibilityRequest): CompatibilityResult {
  const [personA, personB] = request.persons;
  const partial = personA.birthTimeStatus === "unknown" || personB.birthTimeStatus === "unknown";
  const calculated = sameDemo(request);
  const known = (id: PersonId) => (id === "A" ? personA : personB).birthTimeStatus === "known";
  const warnings = partial
    ? ["Без времени рождения Асцендент и аспекты к углам не показаны."]
    : [];

  const aspects = (calculated
    ? [
        {
          id: "a-jupiter-square-b-mercury",
          pointA: "jupiter" as const,
          aspect: "square" as const,
          pointB: "mercury" as const,
          orbLabel: "0.12°",
          interpretation:
            "Смысл может разрастаться быстрее, чем его успевают сказать. Одному шире, другому точнее. Напряжение здесь не в теме, а в том, успевает ли фраза за масштабом.",
          primary: true,
          requiresTime: null,
        },
        {
          id: "a-venus-sextile-b-mercury",
          pointA: "venus" as const,
          aspect: "sextile" as const,
          pointB: "mercury" as const,
          orbLabel: "0.46°",
          interpretation:
            "Тепло и речь могут сходиться легко. Нравиться и говорить об этом здесь не обязательно разные действия.",
          primary: true,
          requiresTime: null,
        },
        {
          id: "a-sun-opposition-b-moon",
          pointA: "sun" as const,
          aspect: "opposition" as const,
          pointB: "moon" as const,
          orbLabel: "0.87°",
          interpretation:
            "То, как один себя показывает, и то, как другому нужно чувствовать безопасность, могут тянуть в разные стороны. Рядом это звучит как разный темп тепла.",
          primary: true,
          requiresTime: null,
        },
        {
          id: "a-jupiter-trine-b-venus",
          pointA: "jupiter" as const,
          aspect: "trine" as const,
          pointB: "venus" as const,
          orbLabel: "1.61°",
          interpretation:
            "Щедрость и удовольствие могут находить друг друга без спора. Признание здесь может расширяться, а не проверяться.",
          primary: false,
          requiresTime: null,
        },
        {
          id: "a-sun-sextile-b-asc",
          pointA: "sun" as const,
          aspect: "sextile" as const,
          pointB: "ascendant" as const,
          orbLabel: "1.72°",
          interpretation:
            "То, как один проявляется, может легко читаться в том, как другой входит в контакт.",
          primary: false,
          requiresTime: "B" as const,
        },
        {
          id: "a-asc-square-b-saturn",
          pointA: "ascendant" as const,
          aspect: "square" as const,
          pointB: "saturn" as const,
          orbLabel: "1.91°",
          interpretation:
            "Первое впечатление и потребность в границе могут тереться. Близости может понадобиться больше времени, чем обещает начало.",
          primary: false,
          requiresTime: "A" as const,
        },
        {
          id: "a-moon-sextile-b-mars",
          pointA: "moon" as const,
          aspect: "sextile" as const,
          pointB: "mars" as const,
          orbLabel: "2.84°",
          interpretation:
            "Чувство и желание могут находить общий шаг. Побуждение действовать и потребность сначала почувствовать здесь не обязательно спорят.",
          primary: false,
          requiresTime: null,
        },
        {
          id: "a-mercury-trine-b-saturn",
          pointA: "mercury" as const,
          aspect: "trine" as const,
          pointB: "saturn" as const,
          orbLabel: "3.34°",
          interpretation:
            "Разговор может становиться точнее и устойчивее. Мысль здесь выдерживает проверку и не теряет хода.",
          primary: false,
          requiresTime: null,
        },
        {
          id: "a-mars-square-b-moon",
          pointA: "mars" as const,
          aspect: "square" as const,
          pointB: "moon" as const,
          orbLabel: "3.65°",
          interpretation:
            "Скорость действия и потребность сначала почувствовать безопасность могут разминуться. Один уже движется, другому ещё нужно понять, что это можно.",
          primary: false,
          requiresTime: null,
        },
        {
          id: "a-mercury-trine-b-jupiter",
          pointA: "mercury" as const,
          aspect: "trine" as const,
          pointB: "jupiter" as const,
          orbLabel: "3.88°",
          interpretation:
            "Идеи в разговоре могут расти. Мысль одного и масштаб другого могут усиливать друг друга.",
          primary: false,
          requiresTime: null,
        },
        {
          id: "a-mars-opposition-b-sun",
          pointA: "mars" as const,
          aspect: "opposition" as const,
          pointB: "sun" as const,
          orbLabel: "4.85°",
          interpretation:
            "Воля и направление могут вставать друг напротив друга. Вопрос здесь не в сути, а в том, чей темп задаёт движение.",
          primary: false,
          requiresTime: null,
        },
      ]
    : []
  ).filter((aspect) => aspect.requiresTime == null || known(aspect.requiresTime));

  return {
    schemaVersion: "compatibility-preview-v0",
    source: "mock",
    dataQuality: partial ? "partial" : "full",
    warnings,
    persons: calculated
      ? [
          snapshot("A", personA.displayName, personA.birthTimeStatus),
          snapshot("B", personB.displayName, personB.birthTimeStatus),
        ]
      : [
          { id: "A", displayName: personA.displayName, birthTimeStatus: personA.birthTimeStatus, placements: [] },
          { id: "B", displayName: personB.displayName, birthTimeStatus: personB.birthTimeStatus, placements: [] },
        ],
    overview: {
      title: "Самый тесный контакт здесь про темп",
      summary:
        "Смысл одного и речь другого сцеплены почти вплотную. Рядом Солнце и Луна тянут тепло в разные стороны. Отсюда разный темп: одному ясность, другому близость без спешки.",
      observations: [],
    },
    bondSummary: [
      {
        id: "dynamic",
        role: "Общая динамика",
        headline: "Смысл обгоняет тепло",
        text: "Главная тема этой связи — разный масштаб. Речь и смысл сцеплены почти вплотную, а Солнце и Луна тянут присутствие в разные стороны. Противоречие не в интересе, а в том, какой темп считается близостью.",
        image: "/images/cosmoportrait.webp",
      },
      {
        id: "attraction",
        role: "Что вас притягивает",
        headline: "Интерес можно сказать вслух",
        text: "Взаимный интерес держится на речи и признании. Венера встречается с разговором, а Юпитер даёт удовольствию простор, не требуя спора.",
        image: "/images/landscape_stars.webp",
      },
      {
        id: "support",
        role: "На что можно опереться",
        headline: "Мысль выдерживает проверку",
        text: "Опора в том, что разговор может становиться точнее и при этом не сжиматься. Здесь есть место и ясности, и масштабу.",
        image: "/images/landscape_natal_map_2.webp",
      },
      {
        id: "tension",
        role: "Где возникает напряжение",
        headline: "Один уже движется",
        text: "Главное несовпадение — между скоростью действия и потребностью сначала почувствовать, что контакт безопасен. Это заметно и в самом тепле.",
        image: "/images/hero-coastal-moon-trail_4.webp",
      },
      {
        id: "care",
        role: "Что важно учитывать",
        headline: "Граница раньше обиды",
        text: "С этой разницей можно обходиться, если темп называют до того, как он стал доказательством. Первому впечатлению здесь нужно больше времени.",
        image: "/images/report.webp",
      },
    ],
    bonds: [
      {
        id: "pull-recognition",
        category: "Интерес и ответное движение",
        headline: "Признание расширяет интерес",
        insight: "Венере здесь есть и речь, и простор. Интерес можно назвать и дать ему вырасти.",
        basis: "Венера секстиль Меркурий, орб 0.46°. Юпитер тригон Венера, орб 1.61°.",
      },
      {
        id: "support-speech",
        category: "То, что между вами легче поддерживается",
        headline: "Разговор держит и точность, и масштаб",
        insight: "Мысль может становиться строже и при этом не сжиматься. На это можно опереться, когда темп уже разный.",
        basis: "Меркурий тригон Сатурн, орб 3.34°. Меркурий тригон Юпитер, орб 3.88°.",
      },
      {
        id: "pace-meaning",
        category: "Разница ритма",
        headline: "Смысл шире фразы",
        insight: "Одному нужна более широкая картина, другому закончить формулировку. Это самый тесный контакт пары.",
        basis: "Юпитер квадрат Меркурий, орб 0.12°.",
      },
      {
        id: "pace-action",
        category: "Разница ритма",
        headline: "Действие обгоняет чувство",
        insight: "Один уже двигается. Другому ещё нужно понять, что контакт можно выдержать.",
        basis: "Марс квадрат Луна, орб 3.65°. Солнце оппозиция Луна, орб 0.87°.",
      },
      {
        id: "threshold-entry",
        category: "Тема усилия и предела",
        headline: "Входу нужно больше времени",
        insight: "Первое впечатление прямее, чем готова быть близость. Граница здесь другой срок, не отказ.",
        basis: "Асцендент квадрат Сатурн, орб 1.91°.",
      },
    ],
    signComparisons: [
      {
        id: "expression",
        title: "Самовыражение",
        point: "sun",
        aSign: "gemini",
        bSign: "aquarius",
        a: "Близнецы",
        b: "Водолей",
        text: "Оба Солнца живут в идеях. Одному ближе обмен и ход разговора, другому своя позиция, которую не хочется сглаживать.",
      },
      {
        id: "feelings",
        title: "Эмоциональные потребности",
        point: "moon",
        aSign: "taurus",
        bSign: "sagittarius",
        a: "Телец",
        b: "Стрелец",
        text: "Луна в Тельце держит чувство через устойчивость. Луна в Стрельце держит его через смысл и простор.",
      },
      {
        id: "talk",
        title: "Общение",
        point: "mercury",
        aSign: "gemini",
        bSign: "pisces",
        a: "Близнецы",
        b: "Рыбы",
        text: "Одна речь уточняет и возвращается к формулировке. Другая сначала ловит контур, потом слова.",
      },
      {
        id: "values",
        title: "Близость и ценности",
        point: "venus",
        aSign: "taurus",
        bSign: "aries",
        a: "Телец",
        b: "Овен",
        text: "Венера в Тельце держит близость через надёжность. Венера в Овне держит её через живой и прямой интерес.",
      },
      {
        id: "initiative",
        title: "Инициатива и конфликты",
        point: "mars",
        aSign: "virgo",
        bSign: "cancer",
        a: "Дева",
        b: "Рак",
        text: "Один Марс начинает через дело и поправку. Другой через заботу и настроение контакта.",
      },
      {
        id: "presence",
        title: "Как вы проявляетесь",
        point: "ascendant",
        aSign: "scorpio",
        bSign: "aries",
        a: "Скорпион",
        b: "Овен",
        text: "Один входит в контакт собранно и не сразу. Другой входит сразу и прямо.",
      },
    ],
    dimensions: FIXTURE_DIMENSIONS,
    cycles: {
      background:
        "Сейчас рядом два периода разного масштаба. Один делает близость серьёзнее, другой просит больше личного места.",
      active: [
        {
          personId: "A",
          title: "Сатурн к Венере",
          period: "ноябрь 2026 - июнь 2027",
          personalInsight: "Период может делать тему близости более серьёзной и менее импульсивной.",
          relationshipNote: "В паре это может звучать как потребность договаривать условия контакта.",
        },
        {
          personId: "B",
          title: "Юпитер к Солнцу",
          period: "январь 2027 - апрель 2027",
          personalInsight: "Период может расширять образ себя и желание занимать больше места.",
          relationshipNote: "Рядом с другим это может просить больше признания, не обязательно смены роли.",
        },
      ],
      couple: {
        title: "Как ваши периоды сочетаются",
        text: "Один период сужает и уточняет близость, другой расширяет личное присутствие. Вместе они могут спорить о том, сколько места у каждого в паре.",
      },
      upcoming: [
        {
          personId: "A",
          title: "Уран к Меркурию",
          period: "март 2027 - сентябрь 2027",
          note: "Разговор может стать резче и честнее.",
        },
        {
          personId: "B",
          title: "Сатурн к Луне",
          period: "август 2027 - февраль 2028",
          note: "Эмоциональный темп может замедлиться.",
        },
      ],
    },
    natalRows: (["sun", "moon", "mercury", "venus", "mars", "ascendant"] as const).map((point) => ({
      point,
      a: calculated ? placementOf("A", point, known("A")) : null,
      b: calculated ? placementOf("B", point, known("B")) : null,
    })),
    aspects,
    houseOverlays: [],
    reflection: {
      question: "Где вам двоим нужен более медленный темп, а где вы уже умеете быть рядом?",
      conclusion:
        "Разницу темпа можно заметить, пока она ещё проговаривается, а не когда уже стала обидой.",
    },
  };
}
