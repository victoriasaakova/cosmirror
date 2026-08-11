import type { Metadata } from "next";
import { LegalDocument, LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Политика использования cookie — Cosmirror",
  description:
    "Политика использования файлов cookie и аналогичных технологий сервиса Cosmirror, включая Яндекс.Метрику.",
};

export default function CookiesPage() {
  return (
    <LegalDocument title="Политика использования файлов cookie" updatedAt="11 августа 2026 г.">
      <p>
        Настоящая Политика описывает, какие файлы cookie и аналогичные технологии использует сервис
        Cosmirror (далее — «Сервис»), доступный по адресу{" "}
        <a href="https://cosmirror.ru" className="text-[#ffb099] underline-offset-2 hover:underline">
          cosmirror.ru
        </a>
        , в каких целях и как Пользователь может управлять ими.
      </p>
      <p>
        Политика является дополнением к{" "}
        <a href="/privacy" className="text-[#ffb099] underline-offset-2 hover:underline">
          Политике конфиденциальности
        </a>
        . Обработка персональных данных, связанных с cookie и аналитикой, осуществляется Оператором:
        Саакова Виктория, ИНН 773180561611, плательщик налога на профессиональный доход. Контакт:{" "}
        <a
          href="mailto:hello@cosmirror.ru"
          className="text-[#ffb099] underline-offset-2 hover:underline"
        >
          hello@cosmirror.ru
        </a>
        .
      </p>

      <LegalSection title="1. Что такое cookie">
        <p>
          Cookie — небольшие текстовые файлы, которые сайт сохраняет на устройстве Пользователя
          (компьютер, смартфон, планшет). Аналогичные технологии включают локальное хранилище
          браузера (localStorage), пиксели, идентификаторы сессии и скрипты аналитики.
        </p>
        <p>
          Cookie могут быть сессионными (удаляются после закрытия браузера) или постоянными
          (хранятся заданный срок либо до удаления Пользователем).
        </p>
      </LegalSection>

      <LegalSection title="2. Зачем мы используем cookie">
        <p>Сервис использует cookie и аналогичные технологии для:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>корректной работы сайта и сохранения технических параметров сессии;</li>
          <li>запоминания прогресса в онбординге и связанных пользовательских сценариях (при их
            наличии);</li>
          <li>сбора статистики посещений и улучшения Сервиса;</li>
          <li>анализа поведения на сайте (карта кликов, вебвизор) — чтобы понимать, как
            Пользователи взаимодействуют с интерфейсом.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Какие cookie и технологии мы используем">
        <p>
          <span className="text-white/85">Технические (необходимые)</span> — обеспечивают базовую
          работу Сервиса (сессия, безопасность, корректная загрузка страниц). Без них отдельные
          функции могут работать некорректно.
        </p>
        <p>
          <span className="text-white/85">Функциональные</span> — помогают сохранять выбор
          Пользователя и состояние интерфейса (например, прогресс форм) в рамках использования
          Сервиса.
        </p>
        <p>
          <span className="text-white/85">Аналитические</span> — используются для статистики и
          улучшения продукта. На Сервисе подключена{" "}
          <span className="text-white/85">Яндекс.Метрика</span> (счётчик № 111358036) со следующими
          функциями:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>учёт посещений, источников трафика и отказов;</li>
          <li>карта кликов (clickmap);</li>
          <li>вебвизор (запись сессий взаимодействия с интерфейсом);</li>
          <li>отслеживание переходов по ссылкам (trackLinks);</li>
          <li>точные показатели отказов (accurateTrackBounce).</li>
        </ul>
        <p>
          Яндекс.Метрика может устанавливать собственные cookie (в том числе на домене yandex.ru /
          связанных доменах) и обрабатывать технические данные: IP-адрес, сведения о браузере и
          устройстве, данные о просмотрах страниц и действиях на сайте. Обработка осуществляется ООО
          «ЯНДЕКС» в соответствии с политикой конфиденциальности Яндекса:{" "}
          <a
            href="https://yandex.ru/legal/confidential/"
            className="text-[#ffb099] underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            yandex.ru/legal/confidential
          </a>
          . Условия использования Метрики:{" "}
          <a
            href="https://yandex.ru/legal/metrica_termsofuse/"
            className="text-[#ffb099] underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            yandex.ru/legal/metrica_termsofuse
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="4. Срок хранения">
        <p>
          Срок хранения cookie зависит от их типа: сессионные удаляются при закрытии браузера;
          постоянные — в соответствии с настройками конкретной cookie или сервиса аналитики (у
          Яндекс.Метрики — по правилам Яндекса), либо до их удаления Пользователем.
        </p>
      </LegalSection>

      <LegalSection title="5. Как управлять cookie">
        <p>Пользователь может:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>ограничить или удалить cookie в настройках браузера;</li>
          <li>использовать режим инкогнито / приватный просмотр;</li>
          <li>
            отключить сбор данных Яндекс.Метрикой через{" "}
            <a
              href="https://yandex.ru/support/metrica/general/opt-out.html"
              className="text-[#ffb099] underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              инструмент отказа Яндекса
            </a>
            ;
          </li>
          <li>
            направить обращение Оператору на{" "}
            <a
              href="mailto:hello@cosmirror.ru"
              className="text-[#ffb099] underline-offset-2 hover:underline"
            >
              hello@cosmirror.ru
            </a>
            .
          </li>
        </ul>
        <p>
          Отключение cookie или аналитики может повлиять на работу отдельных функций Сервиса и на
          качество статистики, но не лишает доступа к основной информации на сайте.
        </p>
      </LegalSection>

      <LegalSection title="6. Согласие">
        <p>
          Продолжая использовать Сервис, Пользователь подтверждает согласие на использование cookie
          и аналогичных технологий в объёме, описанном в настоящей Политике, если иное не следует из
          настроек браузера или явного отказа от аналитики.
        </p>
        <p>
          Вопросы, связанные с персональными данными, регулируются{" "}
          <a href="/privacy" className="text-[#ffb099] underline-offset-2 hover:underline">
            Политикой конфиденциальности
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Изменение Политики">
        <p>
          Оператор может обновлять настоящую Политику. Актуальная версия всегда доступна на этой
          странице.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
