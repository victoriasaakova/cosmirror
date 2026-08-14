import type { Metadata } from "next";
import { BlogShell, BlogTitle, ChevronRight } from "@/components/BlogShell";
import { getAllPosts } from "@/content/blog/posts";

/*
  THESIS: Blog as a continuous editorial reading list — not a card grid of tips.
  OWN-WORLD: Cosmirror navy #050d4a, gold italic Playfair accents, Onest body.
  STORY: Visitor finds Cosmirror's voice on self-knowledge; opens a post or starts the journey.
  FIRST VIEWPORT: Brand + one headline + one line + first post as the lead story.
  FORM: Established Cosmirror world extended; Read mode; list staging (lead + stack).
  FINISH: extension of incumbent world — detector clean, build green; PRODUCT.md/DESIGN.md optional follow-up via /impeccable init
*/

export const metadata: Metadata = {
  title: "Блог Cosmirror",
  description:
    "Заметки Cosmirror о паттернах, астрологических циклах и самопознании без гороскопов «на удачу».",
  openGraph: {
    title: "Блог Cosmirror",
    description:
      "Заметки Cosmirror о паттернах, астрологических циклах и самопознании без гороскопов «на удачу».",
    url: "https://cosmirror.ru/blog/",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();
  const [lead, ...rest] = posts;

  return (
    <BlogShell>
      <header className="mt-14 border-b border-white/10 pb-10 md:mt-16">
        <h1 className="text-4xl font-normal leading-[1.1] tracking-tight text-white md:text-5xl">
          Блог{" "}
          <span className="font-display italic text-[#F6E7A1]">Cosmirror</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
          О закономерностях, циклах и том, как астрология становится зеркалом, а не предсказанием.
        </p>
      </header>

      {lead ? (
        <article className="mt-10 border-b border-white/10 pb-10 md:mt-12 md:pb-12">
          <a href={`/blog/${lead.slug}/`} className="group block">
            <p className="text-sm text-white/40">
              {lead.publishedAt}
              <span className="mx-2 text-white/20" aria-hidden>
                ·
              </span>
              {lead.readingMinutes} мин
            </p>
            <BlogTitle
              as="h2"
              title={lead.title}
              accent={lead.accent}
              className="mt-3 text-2xl font-normal leading-snug tracking-tight text-white transition group-hover:text-[#F6E7A1] md:text-3xl"
            />
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70 md:text-base">
              {lead.excerpt}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#F6E7A1] transition group-hover:gap-2.5">
              Читать
              <ChevronRight className="h-4 w-4" />
            </span>
          </a>
        </article>
      ) : null}

      {rest.length > 0 ? (
        <ul className="mt-2 divide-y divide-white/10">
          {rest.map((post) => (
            <li key={post.slug}>
              <a
                href={`/blog/${post.slug}/`}
                className="group block py-8 transition md:py-9"
              >
                <p className="text-sm text-white/40">
                  {post.publishedAt}
                  <span className="mx-2 text-white/20" aria-hidden>
                    ·
                  </span>
                  {post.readingMinutes} мин
                </p>
                <BlogTitle
                  as="h2"
                  title={post.title}
                  accent={post.accent}
                  className="mt-2 text-xl font-normal leading-snug tracking-tight text-white transition group-hover:text-[#F6E7A1] md:text-2xl"
                />
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/65">
                  {post.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#F6E7A1] transition group-hover:gap-2.5">
                  Читать
                  <ChevronRight className="h-4 w-4" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </BlogShell>
  );
}
