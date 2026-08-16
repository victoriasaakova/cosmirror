import type { Metadata } from "next";
import { LegalDocument, LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Исходный код — Cosmirror",
  description:
    "Исходный код сервиса Cosmirror публикуется под GNU Affero General Public License v3.0.",
};

export default function SourcePage() {
  return (
    <LegalDocument title="Исходный код" updatedAt="16 августа 2026 г.">
      <p>
        Cosmirror распространяется под{" "}
        <a
          href="https://www.gnu.org/licenses/agpl-3.0.html"
          className="text-[#ffb099] underline-offset-2 hover:underline"
        >
          GNU Affero General Public License версии 3
        </a>{" "}
        (AGPL-3.0). Это копия той версии программы, которая работает на{" "}
        <a href="https://cosmirror.ru" className="text-[#ffb099] underline-offset-2 hover:underline">
          cosmirror.ru
        </a>
        .
      </p>

      <LegalSection title="Репозитории">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Сайт:{" "}
            <a
              href="https://github.com/victoriasaakova/cosmirror"
              className="text-[#ffb099] underline-offset-2 hover:underline"
            >
              github.com/victoriasaakova/cosmirror
            </a>
          </li>
          <li>
            API и расчёт карты:{" "}
            <a
              href="https://github.com/victoriasaakova/cosmirror-api"
              className="text-[#ffb099] underline-offset-2 hover:underline"
            >
              github.com/victoriasaakova/cosmirror-api
            </a>
          </li>
        </ul>
        <p>
          Полный текст лицензии лежит в файле LICENSE каждого репозитория. Почта, ключи, база
          пользователей и ответы онбординга в исходники не входят.
        </p>
      </LegalSection>

      <LegalSection title="Swiss Ephemeris">
        <p>
          Натальная карта считается через Swiss Ephemeris (Astrodienst AG) и библиотеку pyswisseph.
          Оба компонента доступны по AGPL; Cosmirror идёт тем же путём. Подробнее:{" "}
          <a
            href="https://www.astro.com/swisseph/"
            className="text-[#ffb099] underline-offset-2 hover:underline"
          >
            astro.com/swisseph
          </a>
          .
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
