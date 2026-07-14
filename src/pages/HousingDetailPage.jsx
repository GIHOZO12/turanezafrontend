import React from "react";
import { Link, useParams } from "react-router-dom";
import { housingOptions } from "../data/landingContent";

const HousingDetailPage = () => {
  const { slug } = useParams();
  const housing = housingOptions.find((option) => option.slug === slug);

  if (!housing) {
    return (
      <div className="min-h-screen bg-porcelain px-4 py-16 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-card bg-white p-10 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Not Found
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">
            This project is not available.
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Try returning to the landing page to view current housing
            opportunities.
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
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(12, 22, 45, 0.9), rgba(15, 23, 42, 0.7)), url('${housing.image}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-20 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 rounded-pill border border-white/30 px-4 py-2 text-sm font-semibold text-white/90 transition duration-cozy ease-cozy hover:border-white hover:text-white"
          >
            ← Back
          </Link>
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-mint">
              {housing.status}
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
              {housing.name}
            </h1>
            <p className="mt-5 text-lg font-light text-white/85">
              {housing.description}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr,0.9fr] lg:px-8">
        <div className="rounded-card bg-white p-8 shadow-card">
          <h2 className="text-2xl font-semibold text-slate-900">
            Project overview
          </h2>
          <p className="mt-4 text-base text-slate-600">{housing.overview}</p>
          <div className="mt-8 rounded-card bg-porcelain p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Highlights
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {housing.highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-mint" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 rounded-card bg-porcelain p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Photo gallery
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Reserved for property photos.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="aspect-[4/3] rounded-2xl border border-dashed border-slate-200 bg-white/70" />
              <div className="aspect-[4/3] rounded-2xl border border-dashed border-slate-200 bg-white/70" />
              <div className="aspect-[4/3] rounded-2xl border border-dashed border-slate-200 bg-white/70" />
              <div className="aspect-[4/3] rounded-2xl border border-dashed border-slate-200 bg-white/70" />
            </div>
          </div>
          <div className="mt-8 rounded-card bg-porcelain p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Tour video
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Reserved for a property walkthrough video.
            </p>
            <div className="mt-4 aspect-video rounded-2xl border border-dashed border-slate-200 bg-white/70" />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-card bg-white p-8 shadow-card">
            <h3 className="text-xl font-semibold text-slate-900">
              Quick facts
            </h3>
            <div className="mt-6 grid gap-4 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Location</span>
                <span className="font-medium text-slate-900">
                  {housing.location}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="font-semibold text-slate-500">Investors</span>
                <span className="font-medium text-slate-900">
                  {housing.metrics.investors}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="font-semibold text-slate-500">Returns</span>
                <span className="font-medium text-primary">
                  {housing.metrics.returns}
                </span>
              </div>
            </div>
            {housing.driveTimes?.length ? (
              <div className="mt-6 border-t border-slate-100 pt-6 text-sm text-slate-600">
                <p className="font-semibold text-slate-500">Drive times</p>
                <ul className="mt-3 space-y-2">
                  {housing.driveTimes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-card bg-slate-900 p-8 text-white shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-mint">
              Next step
            </p>
            <h3 className="mt-4 text-2xl font-semibold">
              Reserve your spot today.
            </h3>
            <p className="mt-4 text-sm text-white/80">
              Submit your interest and our team will share full project briefs,
              financials, and timelines.
            </p>
            <a
              href="/#invest-form"
              className="mt-6 inline-flex items-center rounded-pill bg-mint px-5 py-3 text-sm font-semibold text-slate-900 transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-mint/90"
            >
              Start investing
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HousingDetailPage;
