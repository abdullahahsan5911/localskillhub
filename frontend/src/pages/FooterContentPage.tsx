import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import type { FooterPageContent } from "@/data/footerContent";

interface FooterContentPageProps {
  page: FooterPageContent;
}

const FooterContentPage = ({ page }: FooterContentPageProps) => {
  return (
    <Layout>
      <section className="bg-white">
        <div className="border-b border-gray-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
              {page.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
              {page.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              {page.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to={page.ctaHref}>
                <Button className="rounded-full bg-blue-600 px-7 py-6 text-white hover:bg-blue-500">
                  {page.ctaLabel}
                </Button>
              </Link>
              <Link to="/">
                <Button
                  variant="outline"
                  className="rounded-full border-zinc-700 bg-transparent px-7 py-6 text-zinc-100 hover:bg-zinc-800 hover:text-white"
                >
                  Back to home
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid gap-6 md:grid-cols-2">
            {page.sections.map((section) => (
              <article
                key={section.title}
                className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm"
              >
                <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
                <p className="mt-4 text-base leading-7 text-gray-600">{section.body}</p>
                {section.points && section.points.length > 0 ? (
                  <ul className="mt-6 space-y-3">
                    {section.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-gray-700">
                        <FiCheckCircle className="mt-1 h-5 w-5 flex-none text-blue-600" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-zinc-900 bg-zinc-950 p-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-blue-300">Next step</p>
                <h2 className="mt-2 text-2xl font-semibold">Continue exploring LocalSkillHub</h2>
                <p className="mt-3 max-w-2xl text-zinc-300">
                  Move from information to action with live profiles, jobs, community activity, and verification tools.
                </p>
              </div>
              <Link to={page.ctaHref}>
                <Button className="rounded-full bg-white px-6 py-6 text-zinc-950 hover:bg-zinc-200">
                  {page.ctaLabel}
                  <FiArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FooterContentPage;