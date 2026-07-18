import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import InvestorLayout from '../components/InvestorLayout';
import { fetchGroupById, submitGroupApplication, sendGroupMessage } from '../api/groups';
import { fetchCurrentUser } from '../api/users';
import { formatFlexibleCurrency } from '../utils/currency';

const occupationOptions = [
  { value: 'employee', label: 'Employee' },
  { value: 'entrepreneur', label: 'Entrepreneur / Business Owner' },
  { value: 'student', label: 'Student' },
  { value: 'none', label: 'No Occupation' },
  { value: 'other', label: 'Other' },
];

const defaultForm = {
  name: '',
  email: '',
  phoneNumber: '',
  location: '',
  occupation: 'employee',
  idNumber: '',
  motivation: '',
  skills: '',
  hasExperience: false,
  financialReady: false,
  understandsCommitment: false,
  commitmentConfirmation: false,
  consentAcknowledged: false,
  bankStatement: null,
  criminalRecord: null,
  notes: '',
};

const resolveCapacityTarget = (group) => {
  const totalUnits = Number(group?.total_units);
  if (Number.isFinite(totalUnits) && totalUnits > 0) {
    return totalUnits;
  }
  const maxMembers = Number(group?.max_members);
  if (Number.isFinite(maxMembers) && maxMembers > 0) {
    return maxMembers;
  }
  return null;
};

const formatUsd = (value) => formatFlexibleCurrency(value);

const JoinGroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [group, setGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [contactMessage, setContactMessage] = useState('');
  const [contactFeedback, setContactFeedback] = useState(null);
  const [contactSending, setContactSending] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      setLoadingUser(true);
      try {
        const response = await fetchCurrentUser();
        if (mounted) {
          setUser(response);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    };

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loadingUser && !user) {
      const nextPath = encodeURIComponent(`/groups/${groupId}/join`);
      navigate(`/auth?next=${nextPath}`, { replace: true });
    }
  }, [groupId, loadingUser, navigate, user]);

  useEffect(() => {
    const loadGroup = async () => {
      setLoadingGroup(true);
      setServerError(null);
      try {
        const response = await fetchGroupById(groupId);
        setGroup(response);
      } catch (error) {
        setServerError(error.message || 'Unable to load group information right now.');
      } finally {
        setLoadingGroup(false);
      }
    };
    loadGroup();
  }, [groupId]);

  useEffect(() => {
    if (!user) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      name: prev.name || user.full_name || '',
      email: prev.email || user.email || '',
      phoneNumber: prev.phoneNumber || user.phone || '',
    }));
  }, [user]);

  const depositPaid = Boolean(user?.deposit_paid);

  const leadName = useMemo(() => {
    if (!group?.created_by) {
      return 'Urban Evolution Group';
    }
    return group.created_by.full_name || group.created_by.email || 'Urban Evolution Group';
  }, [group?.created_by]);

  const groupCode = useMemo(
    () => (group ? group.reference_code || String(group.id || '').padStart(5, '0') : '00000'),
    [group],
  );
  const unitShareLabel = useMemo(() => formatUsd(group?.member_unit_share), [group?.member_unit_share]);
  const membersCount = group?.members_count ?? 0;
  const capacityTarget = useMemo(() => resolveCapacityTarget(group), [group]);
  const memberCapacityLabel = useMemo(
    () => (capacityTarget ? `${membersCount}/${capacityTarget}` : `${membersCount}`),
    [capacityTarget, membersCount],
  );

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
    setForm((prev) => {
      if (type === 'file') {
        return { ...prev, [name]: files && files[0] ? files[0] : null };
      }
      if (type === 'checkbox') {
        return { ...prev, [name]: checked };
      }
      return { ...prev, [name]: value };
    });
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
    if (!form.name.trim()) {
      next.name = 'Please share your full name.';
    }
    if (!form.email.trim()) {
      next.email = 'Email is required.';
    }
    if (!form.phoneNumber.trim()) {
      next.phoneNumber = 'Phone number is required.';
    }
    if (!form.location.trim()) {
      next.location = 'Where are you based?';
    }
    if (!form.idNumber.trim()) {
      next.idNumber = 'Provide your ID / passport number.';
    }
    if (!form.motivation.trim()) {
      next.motivation = 'Tell us why you want to join.';
    }
    if (!form.skills.trim()) {
      next.skills = 'Share the skills or capital you bring.';
    }
    if (!form.bankStatement) {
      next.bankStatement = 'Attach a recent bank statement or proof of funds.';
    }
    if (!form.criminalRecord) {
      next.criminalRecord = 'Attach a recent certificate of good conduct.';
    }
    if (!form.commitmentConfirmation) {
      next.commitmentConfirmation = 'Please confirm your understanding of the commitment.';
    }
    if (!form.consentAcknowledged) {
      next.consentAcknowledged = 'Consent is required to continue.';
    }
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!group) {
      return;
    }
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setSubmitting(true);
    setServerError(null);

    try {
      const payload = new FormData();
      payload.append('group', group.id);
      payload.append('name', form.name.trim());
      payload.append('email', form.email.trim());
      payload.append('phone_number', form.phoneNumber.trim());
      payload.append('location', form.location.trim());
      payload.append('occupation', form.occupation);
      payload.append('id_number', form.idNumber.trim());
      payload.append('motivation', form.motivation.trim());
      payload.append('skills', form.skills.trim());
      payload.append('notes', form.notes.trim());
      payload.append('has_experience', form.hasExperience ? 'true' : 'false');
      payload.append('financial_ready', form.financialReady ? 'true' : 'false');
      payload.append('understands_commitment', form.understandsCommitment ? 'true' : 'false');
      payload.append('commitment_confirmation', form.commitmentConfirmation ? 'true' : 'false');
      payload.append('consent_acknowledged', form.consentAcknowledged ? 'true' : 'false');
      if (form.bankStatement) {
        payload.append('proof_of_funds', form.bankStatement);
      }
      if (form.criminalRecord) {
        payload.append('criminal_record', form.criminalRecord);
      }

      const response = await submitGroupApplication(payload);
      navigate(`/applications/${response.id}/pay-commitment-fee`, { replace: true });
    } catch (error) {
      const nextErrors = {};
      let message = error.message || 'Unable to submit your application right now.';
      if (error.payload && typeof error.payload === 'object') {
        Object.entries(error.payload).forEach(([key, value]) => {
          const entry = Array.isArray(value) ? value[0] : value;
          if (!entry) {
            return;
          }
          if (key === 'non_field_errors' || key === 'detail') {
            message = entry;
            return;
          }
          nextErrors[key] = entry;
        });
      }
      setErrors(nextErrors);
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactAdmin = async (event) => {
    event.preventDefault();
    if (!group?.created_by?.id || !contactMessage.trim()) {
      return;
    }
    setContactSending(true);
    setContactFeedback(null);
    try {
      await sendGroupMessage({
        group: group.id,
        body: contactMessage.trim(),
        recipient_id: group.created_by.id,
      });
      setContactMessage('');
      setContactFeedback({
        type: 'success',
        message: 'Message sent. Expect a reply via email shortly.',
      });
    } catch (contactError) {
      setContactFeedback({
        type: 'error',
        message: contactError.message || 'Unable to reach the admin right now.',
      });
    } finally {
      setContactSending(false);
    }
  };

  if (loadingGroup || loadingUser) {
    return (
      <InvestorLayout active="groups">
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-600">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-card">
            <span className="h-3 w-3 animate-ping rounded-full bg-primary" />
            Preparing your application form...
          </div>
        </div>
      </InvestorLayout>
    );
  }

  if (serverError && !group) {
    return (
      <InvestorLayout active="groups">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="max-w-md rounded-3xl bg-white p-6 text-center shadow-card">
            <p className="text-base font-semibold text-slate-900">Group unavailable</p>
            <p className="mt-2 text-sm text-slate-500">{serverError}</p>
            <Link
              to="/groups"
              className="mt-4 inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
            >
              Back to groups
            </Link>
          </div>
        </div>
      </InvestorLayout>
    );
  }

  return (
    <InvestorLayout active="groups">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Join this group</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              #{groupCode} · {group?.name || 'Investment group'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Complete the diligence checklist to join {leadName}. Once approved you will unlock chat, governance, and
              investment tracking tools for this group.
            </p>
            {!depositPaid ? (
              <p className="mt-2 text-sm font-semibold text-amber-700">
                  If your RWF 100,000 commitment deposit is still under review, you can continue with this application and the team will verify it.
              </p>
            ) : null}
          </div>
          <Link
            to={`/groups/${group?.id || ''}`}
            className="inline-flex items-center gap-2 rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary/60 hover:text-primary"
          >
            <span aria-hidden="true">&larr;</span>
            Group overview
          </Link>
        </div>

        {serverError ? (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-600">
            {serverError}
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card" noValidate>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="jg-name">
                  Full name
                </label>
                <input
                  id="jg-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className={clsx(
                    'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-inner focus:outline-none focus:ring-2',
                    errors.name
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary focus:ring-primary/10',
                  )}
                />
                {errors.name ? <p className="mt-1 text-xs text-rose-500">{errors.name}</p> : null}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="jg-email">
                  Email
                </label>
                <input
                  id="jg-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={clsx(
                    'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-inner focus:outline-none focus:ring-2',
                    errors.email
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary focus:ring-primary/10',
                  )}
                />
                {errors.email ? <p className="mt-1 text-xs text-rose-500">{errors.email}</p> : null}
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="jg-phone">
                  Phone number
                </label>
                <input
                  id="jg-phone"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="+2507..."
                  className={clsx(
                    'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:outline-none focus:ring-2',
                    errors.phoneNumber
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary focus:ring-primary/10',
                  )}
                />
                {errors.phoneNumber ? <p className="mt-1 text-xs text-rose-500">{errors.phoneNumber}</p> : null}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="jg-location">
                  Location / city
                </label>
                <input
                  id="jg-location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Kigali, Rwanda"
                  className={clsx(
                    'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:outline-none focus:ring-2',
                    errors.location
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary focus:ring-primary/10',
                  )}
                />
                {errors.location ? <p className="mt-1 text-xs text-rose-500">{errors.location}</p> : null}
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="jg-occupation">
                  Occupation
                </label>
                <select
                  id="jg-occupation"
                  name="occupation"
                  value={form.occupation}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                >
                  {occupationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="jg-id">
                  National ID / Passport
                </label>
                <input
                  id="jg-id"
                  name="idNumber"
                  value={form.idNumber}
                  onChange={handleChange}
                  placeholder="ID123456789"
                  className={clsx(
                    'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:outline-none focus:ring-2',
                    errors.idNumber
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-primary focus:ring-primary/10',
                  )}
                />
                {errors.idNumber ? <p className="mt-1 text-xs text-rose-500">{errors.idNumber}</p> : null}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="jg-motivation">
                Why this group?
              </label>
              <textarea
                id="jg-motivation"
                name="motivation"
                value={form.motivation}
                onChange={handleChange}
                placeholder="Describe your investment focus, capital readiness, or the impact you want to achieve with the group."
                className={clsx(
                  'mt-2 h-28 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:outline-none focus:ring-2',
                  errors.motivation
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-primary focus:ring-primary/10',
                )}
                maxLength={600}
              />
              {errors.motivation ? (
                <p className="mt-1 text-xs text-rose-500">{errors.motivation}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Keep it under 600 characters.</p>
              )}
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="jg-skills">
                What value do you bring?
              </label>
              <textarea
                id="jg-skills"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="Describe liquidity, experience, networks, or expertise you can offer other members."
                className={clsx(
                  'mt-2 h-24 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:outline-none focus:ring-2',
                  errors.skills
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-primary focus:ring-primary/10',
                )}
                maxLength={500}
              />
              {errors.skills ? (
                <p className="mt-1 text-xs text-rose-500">{errors.skills}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Highlight concrete support you'll provide.</p>
              )}
            </div>

            <div className="mt-6 grid gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 md:grid-cols-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="hasExperience"
                  checked={form.hasExperience}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                I have invested with a syndicate or group before.
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="financialReady"
                  checked={form.financialReady}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                My funds are available for deployment within 30 days.
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="understandsCommitment"
                  checked={form.understandsCommitment}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                    I understand the RWF 100,000 commitment fee.
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="commitmentConfirmation"
                  checked={form.commitmentConfirmation}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                I commit to the group's minimum ticket size.
              </label>
            </div>
            {errors.commitmentConfirmation ? (
              <p className="mt-1 text-xs text-rose-500">{errors.commitmentConfirmation}</p>
            ) : null}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="jg-bank">
                  Bank statement / Proof of funds
                </label>
                <input
                  id="jg-bank"
                  name="bankStatement"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleChange}
                  className={clsx(
                    'mt-2 w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10',
                    errors.bankStatement ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : '',
                  )}
                />
                {errors.bankStatement ? (
                  <p className="mt-1 text-xs text-rose-500">{errors.bankStatement}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">Upload a PDF or image no larger than 10MB.</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="jg-criminal">
                  Criminal record / Certificate of good conduct
                </label>
                <input
                  id="jg-criminal"
                  name="criminalRecord"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleChange}
                  className={clsx(
                    'mt-2 w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10',
                    errors.criminalRecord ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : '',
                  )}
                />
                {errors.criminalRecord ? (
                  <p className="mt-1 text-xs text-rose-500">{errors.criminalRecord}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">Recent (last 12 months) preferred.</p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="jg-notes">
                Additional notes (optional)
              </label>
              <textarea
                id="jg-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Share compliance references, liquidity timelines, or anything the admin should know."
                className="mt-2 h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                maxLength={500}
              />
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <input
                id="jg-consent"
                name="consentAcknowledged"
                type="checkbox"
                checked={form.consentAcknowledged}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="jg-consent" className="text-xs text-slate-600">
                I confirm the above information is accurate and grant Urban Evolution Group permission to contact me
                regarding onboarding, compliance, and investment opportunities.
              </label>
            </div>
            {errors.consentAcknowledged ? (
              <p className="mt-1 text-xs text-rose-500">{errors.consentAcknowledged}</p>
            ) : null}

            {group?.created_by ? (
              <div className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-5 text-sm text-slate-600">
                <p className="text-sm font-semibold text-primary">Need clarity before joining?</p>
                <p className="mt-1 text-xs text-slate-500">
                  Send a quick note to {group.created_by.full_name || group.created_by.email}. They will receive this
                  message even if you are not yet a member.
                </p>
                {contactFeedback ? (
                  <div
                    className={clsx(
                      'mt-3 rounded-2xl px-3 py-2 text-xs',
                      contactFeedback.type === 'success'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border border-rose-200 bg-rose-50 text-rose-600',
                    )}
                  >
                    {contactFeedback.message}
                  </div>
                ) : null}
                <form onSubmit={handleContactAdmin} className="mt-3 space-y-3">
                  <textarea
                    value={contactMessage}
                    onChange={(event) => setContactMessage(event.target.value)}
                    rows={3}
                    placeholder="Introduce yourself or ask a question..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                  <button
                    type="submit"
                    disabled={contactSending || !contactMessage.trim()}
                    className={clsx(
                      'rounded-pill px-4 py-2 text-xs font-semibold text-white transition duration-150 ease-in-out',
                      contactSending || !contactMessage.trim()
                        ? 'cursor-not-allowed bg-primary/60'
                        : 'bg-primary hover:bg-primary/90',
                    )}
                  >
                    {contactSending ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              </div>
            ) : null}

            <div className="mt-8 flex items-center justify-end gap-3">
              <Link
                to={`/groups/${group?.id || ''}`}
                className="rounded-pill px-4 py-2 text-sm font-semibold text-slate-500 transition duration-150 ease-in-out hover:bg-slate-100"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className={clsx(
                  'rounded-pill px-5 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-in-out',
                  submitting ? 'cursor-not-allowed bg-primary/60' : 'bg-primary hover:bg-primary/90',
                )}
              >
                {submitting ? 'Submitting...' : 'Submit application'}
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 text-sm text-slate-600 shadow-card">
              <p className="text-sm font-semibold text-primary">Group snapshot</p>
              <div className="mt-3 space-y-2 text-xs">
                <p>
                  <span className="font-semibold text-slate-900">Group #:</span> #{groupCode}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Lead:</span> {leadName}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Building cost:</span> {formatUsd(group?.building_cost)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Your unit share:</span> {unitShareLabel}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Min investment:</span>{' '}
                  {formatUsd(group?.min_investment)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Investors:</span> {memberCapacityLabel}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Status:</span>{' '}
                  {group?.status ? group.status.charAt(0).toUpperCase() + group.status.slice(1) : 'Pending'}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-xs text-slate-600 shadow-card">
              <p className="text-sm font-semibold text-slate-900">Required documents</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Recent bank statement or proof of funds.</li>
                <li>Certificate of good conduct or criminal record clearance.</li>
                <li>National ID or passport number.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-xs text-slate-600">
              <p className="text-sm font-semibold text-slate-900">What happens next?</p>
              <ol className="mt-2 space-y-2">
                <li>1. The admin and UEG team review your documentation.</li>
                    <li>2. You will be asked to pay the RWF 100,000 commitment fee.</li>
                <li>3. On approval you receive chat access, governance tools, and investor status.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </InvestorLayout>
  );
};

export default JoinGroupPage;
