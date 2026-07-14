import React from "react";
import { Link, useParams } from "react-router-dom";
import { storyHighlights } from "../data/landingContent";

const StoryDetailPage = () => {
  const { slug } = useParams();
  const story = storyHighlights.find((item) => item.slug === slug);

  if (!story) {
    return (
      <div className="min-h-screen bg-porcelain px-4 py-16 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-card bg-white p-10 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Not Found</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">This story is not available.</h1>
          <p className="mt-4 text-base text-slate-600">
            Try returning to the landing page to explore our latest stories.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-white shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-primary/90"
          >
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-porcelain text-slate-900">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-white to-mint/10" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 py-20 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary"
          >
            Back
          </Link>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Story</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">{story.title}</h1>
            <p className="mt-4 text-lg font-light text-slate-600">{story.summary}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="rounded-card bg-white p-8 shadow-card">
          <div className="space-y-6 text-base text-slate-600">
            {story.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-500">
            <p className="font-semibold text-slate-700">Louis Marie SHAMBO</p>
            <p>The Founder of TURANEZA App and Urban Evolution Group.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StoryDetailPage;
