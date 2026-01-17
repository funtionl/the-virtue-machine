import { Link } from "react-router-dom";
import { HeartHandshake, MessageCircleHeart, ShieldCheck } from "lucide-react";

const Home = () => {
  return (
    <section className="space-y-12">
      <div className="rounded-3xl bg-white/80 p-10 shadow-sm ring-1 ring-amber-100">
        <div className="max-w-2xl space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-600">
            The Virtue Machine
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
            A positivity-first social platform that rewrites every post into
            constructive, encouraging language.
          </h1>
          <p className="text-lg text-slate-600">
            Share what matters. Our in-browser AI gently transforms negative
            phrasing into supportive, uplifting messages while preserving your
            intent.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/app"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Enter the App
            </Link>
            <Link
              to="/sign-up"
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "AI Content Auditing",
            description:
              "Every post, comment, and reaction is reviewed in-browser to keep the vibe supportive.",
            icon: ShieldCheck
          },
          {
            title: "Constructive Rewriting",
            description:
              "Negative phrasing is reframed into helpful encouragement without losing meaning.",
            icon: MessageCircleHeart
          },
          {
            title: "Positive-First Reactions",
            description:
              "No downvotes or pile-ons. Feedback is designed to celebrate and uplift.",
            icon: HeartHandshake
          }
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Home;
