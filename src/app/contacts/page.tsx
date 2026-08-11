import type { Metadata } from "next";
import { LegalDocument, LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Контакты — Cosmirror",
  description: "Контактные данные сервиса Cosmirror.",
};

export default function ContactsPage() {
  return (
    <LegalDocument title="Контакты" updatedAt="11 августа 2026 г.">
      <p>
        По вопросам Сервиса, персональных данных, оплаты и оферты пишите на почту ниже. Мы ответим в
        разумный срок.
      </p>

      <LegalSection title="Связь">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-white/85">Email:</span>{" "}
            <a
              href="mailto:hello@cosmirror.ru"
              className="text-[#ffb099] underline-offset-2 hover:underline"
            >
              hello@cosmirror.ru
            </a>
          </li>
          <li>
            <span className="text-white/85">Сайт:</span>{" "}
            <a
              href="https://cosmirror.ru"
              className="text-[#ffb099] underline-offset-2 hover:underline"
            >
              cosmirror.ru
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Реквизиты">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-white/85">ФИО:</span> Саакова Виктория
          </li>
          <li>
            <span className="text-white/85">ИНН:</span> 773180561611
          </li>
          <li>
            <span className="text-white/85">Статус:</span> плательщик налога на профессиональный доход
            (самозанятый)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Документы">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <a href="/privacy" className="text-[#ffb099] underline-offset-2 hover:underline">
              Политика конфиденциальности
            </a>
          </li>
          <li>
            <a href="/cookies" className="text-[#ffb099] underline-offset-2 hover:underline">
              Политика cookie
            </a>
          </li>
          <li>
            <a href="/terms" className="text-[#ffb099] underline-offset-2 hover:underline">
              Пользовательское соглашение
            </a>
          </li>
          <li>
            <a href="/offer" className="text-[#ffb099] underline-offset-2 hover:underline">
              Публичная оферта
            </a>
          </li>
        </ul>
      </LegalSection>
    </LegalDocument>
  );
}
