import type { Metadata } from "next";
import { LegalDocument, LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Credits — Cosmirror",
  description:
    "Сторонние материалы Cosmirror: тексты Таро Love Oracle (CC BY 4.0), колода Rider-Waite-Smith и Swiss Ephemeris.",
};

export default function CreditsPage() {
  return (
    <LegalDocument title="Credits" updatedAt="31 октября 2026 г.">
      <p>
        Здесь перечислены сторонние материалы, которые Cosmirror использует в сервисе. Сам Cosmirror
        распространяется под AGPL-3.0; исходный код и условия Swiss Ephemeris собраны на странице{" "}
        <a href="/source/" className="text-[#ffb099] underline-offset-2 hover:underline">
          Исходный код
        </a>
        .
      </p>

      <LegalSection title="Таро">
        <p>
          Тексты старших арканов в разборе совместимости взяты из набора{" "}
          <a
            href="https://www.loveoracle.app/dataset"
            className="text-[#ffb099] underline-offset-2 hover:underline"
          >
            Love Oracle Tarot Dataset
          </a>
          . Указание автора:{" "}
          <a
            href="https://www.loveoracle.app"
            className="text-[#ffb099] underline-offset-2 hover:underline"
          >
            Love Oracle
          </a>
          . Лицензия{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="text-[#ffb099] underline-offset-2 hover:underline"
          >
            Creative Commons Attribution 4.0 International
          </a>{" "}
          (CC BY 4.0).
        </p>
        <p>
          Cosmirror копирует только русские формулировки поля love.ru для 22 старших арканов. Формула
          расчёта аркана пары принадлежит Cosmirror и не входит в набор Love Oracle.
        </p>
      </LegalSection>

      <LegalSection title="Изображения карт">
        <p>
          Рисунки колоды Rider-Waite-Smith выполнены Pamela Colman Smith в 1909 году. Они находятся в
          общественном достоянии.
        </p>
      </LegalSection>

      <LegalSection title="Swiss Ephemeris">
        <p>
          Натальная карта считается через Swiss Ephemeris (Astrodienst AG) и библиотеку pyswisseph.
          Подробности лицензии:{" "}
          <a href="/source/" className="text-[#ffb099] underline-offset-2 hover:underline">
            Исходный код
          </a>
          .
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
