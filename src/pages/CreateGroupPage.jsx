import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import InvestorLayout, { InvestorContext } from '../components/InvestorLayout';
import { submitPlotSubmission } from '../api/groups';

const defaultForm = {
  description: '',
  plot_location: '',
  plot_size_sqm: '',
  land_title_number: '',
  ownership_proof: null,
  plot_image: null,
};

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { user, loadingUser } = useContext(InvestorContext);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!loadingUser && !user) {
      navigate('/auth?next=/groups/create', { replace: true });
    }
  }, [loadingUser, user, navigate]);

  const handleChange = (event) => {
    const { name, value, type, files } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'file' ? (files && files[0]) || null : value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const next = {};
    const trimmedDescription = form.description.trim();
    const trimmedPlotLocation = form.plot_location.trim();
    const plotSizeValue = Number(form.plot_size_sqm);
    const trimmedTitleNumber = form.land_title_number.trim();

    if (!trimmedDescription) {
      next.description = 'Describe your plot.';
    } else if (trimmedDescription.length < 10) {
      next.description = 'Description should be at least 10 characters.';
    }

    if (!trimmedPlotLocation) {
      next.plot_location = 'Tell us where the plot is located.';
    }

    if (!form.plot_size_sqm || !Number.isFinite(plotSizeValue) || plotSizeValue <= 0) {
      next.plot_size_sqm = 'Enter the plot size in square meters.';
    }

    if (!trimmedTitleNumber) {
      next.land_title_number = 'Enter the plot\'s UPI (title deed) number.';
    }

    if (!form.ownership_proof) {
      next.ownership_proof = 'Attach a document proving this plot belongs to you.';
    }

    if (!form.plot_image) {
      next.plot_image = 'Attach at least one photo of the plot.';
    }

    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const payload = new FormData();
      payload.append('description', form.description.trim());
      payload.append('plot_location', form.plot_location.trim());
      payload.append('plot_size_sqm', Number(form.plot_size_sqm));
      payload.append('land_title_number', form.land_title_number.trim());
      payload.append('ownership_proof', form.ownership_proof);
      payload.append('plot_image', form.plot_image);
      await submitPlotSubmission(payload);
      setSubmitted(true);
    } catch (error) {
      const nextErrors = {};
      let general = error.message || 'Unable to submit your plot right now.';
      if (error.payload && typeof error.payload === 'object') {
        Object.entries(error.payload).forEach(([key, value]) => {
          const message = Array.isArray(value) ? value[0] : value;
          if (!message) {
            return;
          }
          if (key === 'non_field_errors' || key === 'detail') {
            general = message;
            return;
          }
          nextErrors[key] = message;
        });
      }
      setErrors(nextErrors);
      setServerError(general);
    } finally {
      setSubmitting(false);
    }
  };

  const parsedPlotSize = Number(form.plot_size_sqm);

  const isDisabled =
    submitting ||
    !form.description.trim() ||
    form.description.trim().length < 10 ||
    !form.plot_location.trim() ||
    !Number.isFinite(parsedPlotSize) ||
    parsedPlotSize <= 0 ||
    !form.land_title_number.trim() ||
    !form.ownership_proof ||
    !form.plot_image;

  if (submitted) {
    return (
      <InvestorLayout active="groups">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Submitted for review</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Thanks — your plot is being reviewed</h1>
          <p className="mt-3 text-sm text-slate-600">
            Our team verifies plot ownership and details before it's approved. Once approved, our team creates the
            investment group for it and adds you as a member — then other investors can request to join and help fund
            construction.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/groups"
              className="rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
            >
              Back to groups
            </Link>
            <button
              type="button"
              onClick={() => {
                setForm(defaultForm);
                setErrors({});
                setSubmitted(false);
              }}
              className="rounded-pill border border-emerald-300 px-5 py-2 text-sm font-semibold text-emerald-700 transition duration-150 ease-in-out hover:border-emerald-400"
            >
              Submit another plot
            </button>
          </div>
        </div>
      </InvestorLayout>
    );
  }

  return (
    <InvestorLayout active="groups">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Have a plot?</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Register your plot for review</h1>
            <p className="mt-2 text-sm text-slate-600">
              If you own a plot, tell us about it below. Our team reviews every submission before it's approved.
            </p>
          </div>
          <Link
            to="/groups"
            className="inline-flex items-center gap-2 rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary/60 hover:text-primary"
          >
            <span aria-hidden="true">&larr;</span>
            Back to groups
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 w-full max-w-2xl rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-card"
          noValidate
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Plot registration</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Tell us about your plot</h2>
              <p className="mt-1 text-sm text-slate-500">
                Once approved, our team creates the investment group for this plot and lists it publicly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/groups')}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition duration-150 ease-in-out hover:bg-slate-100 hover:text-slate-600"
            >
              <span aria-hidden="true" className="text-lg leading-none">&times;</span>
              <span className="sr-only">Close form</span>
            </button>
          </div>

          {serverError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {serverError}
            </div>
          ) : null}

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="plot-description">
                Description
              </label>
              <textarea
                id="plot-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the plot — size context, surroundings, why it's a good investment."
                className={clsx(
                  'mt-2 h-32 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:outline-none focus:ring-2',
                  errors.description
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-primary focus:ring-primary/10'
                )}
                minLength={10}
                maxLength={500}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description ? <p className="mt-1 text-xs text-rose-500">{errors.description}</p> : null}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="plot-location">
                Plot location
              </label>
              <input
                id="plot-location"
                name="plot_location"
                value={form.plot_location}
                onChange={handleChange}
                placeholder="e.g. Kigali, Gasabo, Kimironko"
                className={clsx(
                  'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-inner focus:outline-none focus:ring-2',
                  errors.plot_location
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-primary focus:ring-primary/10'
                )}
                maxLength={255}
                aria-invalid={Boolean(errors.plot_location)}
                autoComplete="off"
              />
              {errors.plot_location ? <p className="mt-1 text-xs text-rose-500">{errors.plot_location}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="plot-size">
                  Plot size (m&sup2;)
                </label>
                <input
                  id="plot-size"
                  name="plot_size_sqm"
                  type="number"
                  min={1}
                  step="0.01"
                  inputMode="decimal"
                  value={form.plot_size_sqm}
                  onChange={handleChange}
                  placeholder="500"
                  className={clsx(
                    'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-inner focus:outline-none focus:ring-2',
                    errors.plot_size_sqm
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary focus:ring-primary/10'
                  )}
                  aria-invalid={Boolean(errors.plot_size_sqm)}
                />
                {errors.plot_size_sqm ? <p className="mt-1 text-xs text-rose-500">{errors.plot_size_sqm}</p> : null}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="plot-title-number">
                  UPI / title deed number
                </label>
                <input
                  id="plot-title-number"
                  name="land_title_number"
                  value={form.land_title_number}
                  onChange={handleChange}
                  placeholder="e.g. 1/03/04/03/1234"
                  className={clsx(
                    'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-inner focus:outline-none focus:ring-2',
                    errors.land_title_number
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary focus:ring-primary/10'
                  )}
                  maxLength={100}
                  aria-invalid={Boolean(errors.land_title_number)}
                  autoComplete="off"
                />
                {errors.land_title_number ? <p className="mt-1 text-xs text-rose-500">{errors.land_title_number}</p> : null}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="plot-ownership-proof">
                Proof of ownership
              </label>
              <input
                id="plot-ownership-proof"
                name="ownership_proof"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleChange}
                className={clsx(
                  'mt-2 w-full rounded-2xl border border-dashed bg-white px-4 py-3 text-sm text-slate-600 focus:outline-none focus:ring-2',
                  errors.ownership_proof
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-primary focus:ring-primary/10'
                )}
                aria-invalid={Boolean(errors.ownership_proof)}
              />
              {errors.ownership_proof ? (
                <p className="mt-1 text-xs text-rose-500">{errors.ownership_proof}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  Title deed, sale agreement, or another document proving this plot is yours. PDF or image, up to 10MB.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="plot-image">
                Photo of the plot
              </label>
              <input
                id="plot-image"
                name="plot_image"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleChange}
                className={clsx(
                  'mt-2 w-full rounded-2xl border border-dashed bg-white px-4 py-3 text-sm text-slate-600 focus:outline-none focus:ring-2',
                  errors.plot_image
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-primary focus:ring-primary/10'
                )}
                aria-invalid={Boolean(errors.plot_image)}
              />
              {errors.plot_image ? (
                <p className="mt-1 text-xs text-rose-500">{errors.plot_image}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  A clear photo of the plot itself, so reviewers and future investors can see what it looks like.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <Link
              to="/groups"
              className="rounded-pill px-4 py-2 text-sm font-semibold text-slate-500 transition duration-150 ease-in-out hover:bg-slate-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isDisabled}
              className={clsx(
                'rounded-pill px-5 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-in-out',
                isDisabled ? 'cursor-not-allowed bg-primary/60' : 'bg-primary hover:bg-primary/90'
              )}
            >
              {submitting ? 'Submitting...' : 'Submit for review'}
            </button>
          </div>
        </form>

        <section className="mx-auto mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 text-xs text-slate-600 shadow-card">
            <p className="text-sm font-semibold text-primary">Readiness checklist</p>
            <ul className="mt-3 space-y-2">
              <li>- Confirm you can prove ownership or legal claim to the plot.</li>
              <li>- Have your UPI / title deed number on hand.</li>
              <li>- Be ready to answer follow-up questions from our review team.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-xs text-slate-600 shadow-card">
            <p className="text-sm font-semibold text-slate-900">Why review first?</p>
            <p className="mt-2">
              Every plot is checked for legal standing before it's shown to the community, so investors can trust every
              listing on Urban Evolution Group.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-xs text-slate-600">
            <p className="text-sm font-semibold text-slate-900">What happens next?</p>
            <ol className="mt-3 space-y-2">
              <li>1. Our team verifies your ownership proof and plot details.</li>
              <li>2. Once approved, our team creates the investment group and adds you as a member.</li>
              <li>3. It's listed publicly so people can request to join and help fund construction.</li>
            </ol>
          </div>
        </section>
      </div>
    </InvestorLayout>
  );
};

export default CreateGroupPage;
