import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { fetchGroupPlanSuggestions } from '../api/groups';

const floorOptions = [
  { value: '', label: 'Any' },
  { value: '1', label: '1 floor' },
  { value: '2', label: '2 floors' },
  { value: '3', label: '3 floors' },
  { value: '4', label: '4 floors' },
  { value: '5', label: '5 floors' },
  { value: '6', label: '6+ floors' },
];

const unitOptions = [
  { value: '', label: 'Any' },
  { value: '4', label: '4 units' },
  { value: '8', label: '8 units' },
  { value: '12', label: '12 units' },
  { value: '16', label: '16 units' },
  { value: '20', label: '20+ units' },
];

const roomOptions = [
  { value: '', label: 'Any' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4+' },
];

const styleOptions = [
  { value: '', label: 'Any' },
  { value: 'modern minimal', label: 'Modern minimal' },
  { value: 'contemporary warm', label: 'Contemporary warm' },
  { value: 'tropical modern', label: 'Tropical modern' },
  { value: 'classic stone', label: 'Classic stone' },
];

const siteOptions = [
  { value: '', label: 'Any' },
  { value: 'urban infill', label: 'Urban infill' },
  { value: 'suburban edge', label: 'Suburban edge' },
  { value: 'hillside', label: 'Hillside' },
  { value: 'lakefront', label: 'Lakefront' },
];

const examplePrompts = [
  '4BR family-focused plan with shared green courtyard',
  'Mix of 2BR and 3BR units for young professionals',
  'Studio-heavy plan for rental yield, compact circulation',
  '3BR with flexible work-from-home space and balconies',
];

const GroupPlanAssistant = ({ groupId, canUse }) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
    const [form, setForm] = useState({
      floors: '',
      units: '',
      bedrooms: '',
      bathrooms: '',
      kitchens: '',
      style: '',
      site: '',
      location: '',
      prompt: '',
    });

  const payload = useMemo(
    () => ({
      floors: form.floors || null,
      units: form.units || null,
      bedrooms: form.bedrooms || null,
      bathrooms: form.bathrooms || null,
      kitchens: form.kitchens || null,
      style: form.style || null,
      site: form.site || null,
      location: form.location.trim() || null,
      prompt: form.prompt.trim() || null,
    }),
    [form],
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!canUse) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExample = (value) => {
    setForm((prev) => ({ ...prev, prompt: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!groupId) {
      setError('Select a group before generating suggestions.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetchGroupPlanSuggestions(groupId, payload);
      setResult(response);
    } catch (submitError) {
      setError(submitError.message || 'Unable to generate a plan suggestion right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Plan suggestion assistant</h3>
          <p className="mt-1 text-xs text-slate-500">
            Use this assistant to explore typical architectural plans and align the group on direction.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-pill border border-primary/20 px-4 py-2 text-xs font-semibold text-primary transition duration-150 ease-in-out hover:border-primary hover:text-primary/90"
        >
          Open assistant
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="AI concept assistant"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">AI concept assistant</p>
                <h2 className="text-lg font-semibold text-slate-900">
                  Get suggestions of typical architectural plans
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Share preferences, unit mix, and layout ideas to guide a group discussion.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition duration-150 ease-in-out hover:bg-slate-100 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Floors
                  <select
                    name="floors"
                    value={form.floors}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    {floorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Units
                  <select
                    name="units"
                    value={form.units}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    {unitOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bedrooms
                  <select
                    name="bedrooms"
                    value={form.bedrooms}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    {roomOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bathrooms
                  <select
                    name="bathrooms"
                    value={form.bathrooms}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    {roomOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Kitchens
                  <select
                    name="kitchens"
                    value={form.kitchens}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    {roomOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Style
                  <select
                    name="style"
                    value={form.style}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    {styleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Site context
                  <select
                    name="site"
                    value={form.site}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    {siteOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location (optional)
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="e.g., Kigali, Nyarutarama"
                  />
                </label>
              </div>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Prompt (optional)
                <textarea
                  name="prompt"
                  value={form.prompt}
                  onChange={handleChange}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder="Describe the kind of home you want to co-invest in."
                />
              </label>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-700">Example prompts</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {examplePrompts.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => handleExample(example)}
                      className="rounded-pill border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary hover:text-primary"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-pill px-4 py-2 text-sm font-semibold text-slate-500 transition duration-150 ease-in-out hover:bg-slate-100"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={clsx(
                    'rounded-pill px-5 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-in-out',
                    submitting ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary hover:bg-primary/90',
                  )}
                >
                  {submitting ? 'Generating...' : 'Generate suggestion'}
                </button>
              </div>
            </form>

            {result ? (
              <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{result.title || 'Plan suggestion'}</p>
                  <span className="rounded-pill bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                    Concept only
                  </span>
                </div>
                {result.summary ? (
                  <p className="mt-2 text-sm text-slate-600">{result.summary}</p>
                ) : null}
                {result.layout?.length ? (
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    {result.layout.map((item) => (
                      <p key={item}>- {item}</p>
                    ))}
                  </div>
                ) : null}
                {result.unit_mix?.length ? (
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p className="text-xs font-semibold text-slate-700">Suggested unit mix</p>
                    {result.unit_mix.map((item) => (
                      <p key={item}>- {item}</p>
                    ))}
                  </div>
                ) : null}
                {result.discussion_points?.length ? (
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p className="text-xs font-semibold text-slate-700">Discussion points</p>
                    {result.discussion_points.map((item) => (
                      <p key={item}>- {item}</p>
                    ))}
                  </div>
                ) : null}
                {result.images?.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-700">Concept drawings</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {result.images.map((image, index) => (
                        <div
                          key={`${image.type}-${index}`}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <img
                            src={`data:${image.mime_type || 'image/png'};base64,${image.data}`}
                            alt={`Concept rendering ${index + 1}`}
                            className="h-56 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-pill bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition duration-150 ease-in-out hover:bg-slate-800"
              >
                Back to page
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GroupPlanAssistant;
