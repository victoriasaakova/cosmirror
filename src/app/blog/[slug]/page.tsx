import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogShell, BlogTitle, ChevronLeft } from "@/components/BlogShell";
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
} from "@/content/blog/posts";
import { freshOnboardingHref } from "@/lib/onboarding/paths";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Статья Cosmirror" };

  return {
    title: `${post.title} · Cosmirror`,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} · Cosmirror`,
      description: post.excerpt,
      url: `https://cosmirror.ru/blog/${post.slug}/`,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post.slug);
  const startHref = freshOnboardingHref();

  return (
    <BlogShell>
      <a
        href="/blog/"
        className="mt-10 inline-flex items-center gap-1.5 text-sm text-white/45 transition hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Все статьи
      </a>

      <article className="mt-8">
        <header className="border-b border-white/10 pb-8">
          <p className="text-sm text-white/40">
            {post.publishedAt}
            <span className="mx-2 text-white/20" aria-hidden>
              ·
            </span>
            {post.readingMinutes} мин чтения
          </p>
          <BlogTitle
            title={post.title}
            accent={post.accent}
            className="mt-4 text-3xl font-normal leading-tight tracking-tight text-white md:text-4xl"
          />
        </header>

        <div className="mt-10 space-y-5 text-[15px] font-normal leading-relaxed text-white/80 md:text-base md:leading-[1.75]">
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>

        <aside className="mt-12 rounded-2xl border border-[#F6E7A1]/35 bg-white/[0.03] px-5 py-6 md:px-7 md:py-7">
          <p className="text-lg font-normal leading-snug text-white md:text-xl">
            Хочешь увидеть свои{" "}
            <span className="font-display italic text-[#F6E7A1]">закономерности</span>{" "}
            рядом с картой?
          </p>
          <p className="mt-2 text-sm text-white/60 md:text-[15px]">
            Начни путешествие в Cosmirror: натальная карта, циклы и наблюдения в одном месте.
          </p>
          <a
            href={startHref}
            className="mt-5 inline-flex rounded-full bg-[#F6E7A1] px-5 py-2.5 font-grotesk text-sm font-medium text-[#0a1a3a] shadow-[0_8px_20px_rgba(246,231,161,0.22)] transition hover:scale-[1.02] hover:bg-[#f0dc82] active:scale-[0.98]"
          >
            Начать путешествие
          </a>
        </aside>
      </article>

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-sm font-medium text-white/45">Ещё из блога</h2>
          <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
            {related.map((item) => (
              <li key={item.slug}>
                <a
                  href={`/blog/${item.slug}/`}
                  className="group block py-5 transition"
                >
                  <BlogTitle
                    as="h2"
                    title={item.title}
                    accent={item.accent}
                    className="text-lg font-normal leading-snug text-white transition group-hover:text-[#F6E7A1] md:text-xl"
                  />
                  <p className="mt-1 text-sm text-white/45">{item.publishedAt}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </BlogShell>
  );
}
