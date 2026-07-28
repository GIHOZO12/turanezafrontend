import React, { useContext, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import InvestorLayout, { InvestorContext } from '../components/InvestorLayout';
import { updateCurrentUser, setPassword } from '../api/users';
import { fetchComplianceChecks } from '../api/compliance';

const defaultPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

const statusTone = {
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-600',
};

const AccountPage = () => {
  const { user, loadingUser, refreshUser } = useContext(InvestorContext);
  const [formState, setFormState] = useState({
    full_name: '',
    phone: '',
    country_code: '',
    twofa_enabled: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [loadingCompliance, setLoadingCompliance] = useState(true);
  const [passwordForm, setPasswordForm] = useState(defaultPasswordForm);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  useEffect(() => {
    if (!loadingUser && user) {
      setFormState({
        full_name: user.full_name || '',
        phone: user.phone || '',
        country_code: user.country_code || '',
        twofa_enabled: Boolean(user.twofa_enabled),
      });
    }
  }, [loadingUser, user]);

  useEffect(() => {
    const loadCompliance = async () => {
      if (!user) {
        return;
      }
      setLoadingCompliance(true);
      try {
        const response = await fetchComplianceChecks({ user: user.id });
        const list = Array.isArray(response?.results)
          ? response.results
          : Array.isArray(response)
          ? response
          : [];
        setCompliance(list.find((entry) => `${entry.user}` === `${user.id}`) || list[0] || null);
      } catch (err) {
        setCompliance(null);
      } finally {
        setLoadingCompliance(false);
      }
    };

    if (!loadingUser && user) {
      loadCompliance();
    }
  }, [loadingUser, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await updateCurrentUser({
        full_name: formState.full_name,
        phone: formState.phone,
        country_code: formState.country_code,
        twofa_enabled: formState.twofa_enabled,
      });
      setFeedback({ type: 'success', message: 'Account details updated successfully.' });
      await refreshUser?.();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Unable to update your profile right now.' });
    } finally {
      setSubmitting(false);
    }
  };

  const hasUsablePassword = Boolean(user?.has_usable_password);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordFeedback(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    setPasswordSubmitting(true);
    try {
      await setPassword({
        current_password: passwordForm.currentPassword,
        password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      });
      setPasswordForm(defaultPasswordForm);
      setPasswordFeedback({
        type: 'success',
        message: hasUsablePassword ? 'Password updated successfully.' : 'Password set successfully. You can now log in with it.',
      });
      await refreshUser?.();
    } catch (err) {
      setPasswordFeedback({ type: 'error', message: err.message || 'Unable to update your password right now.' });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const complianceTiles = useMemo(() => {
    if (!compliance) {
      return [];
    }
    return [
      { key: 'kyc_status', label: 'Identity verification', status: compliance.kyc_status },
      { key: 'aml_status', label: 'AML screening', status: compliance.aml_status },
      { key: 'pep_status', label: 'PEP check', status: compliance.pep_status },
      { key: 'ofac_status', label: 'OFAC screening', status: compliance.ofac_status },
    ];
  }, [compliance]);

  return (
    <InvestorLayout active="account">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Account settings</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Manage your investor profile and security preferences
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Keep your contact information accurate so Urban Evolution Group can reach you quickly for allocations and
            distributions.
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Profile information</p>
          <p className="mt-1 text-xs text-slate-500">
            Your email and verification status are locked once confirmed. Update your name, phone, or country as needed.
          </p>

          {feedback ? (
            <div
              className={clsx(
                'mt-4 rounded-2xl border px-4 py-3 text-xs',
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-600',
              )}
            >
              {feedback.message}
            </div>
          ) : null}

          <form className="mt-5 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Full name
              </label>
              <input
                type="text"
                value={formState.full_name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    full_name: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                placeholder="Your legal name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Role
              </label>
              <input
                type="text"
                value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Investor'}
                disabled
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Country code
              </label>
              <input
                type="text"
                value={formState.country_code}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    country_code: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                placeholder="+250"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Phone number
              </label>
              <input
                type="tel"
                value={formState.phone}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                placeholder="+250 788 123 456"
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:col-span-2">
              <div>
                <p className="font-semibold text-slate-700">Two-factor authentication</p>
                <p className="mt-1 text-slate-500">
                  Add an extra layer of security when logging into your investor dashboard.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={formState.twofa_enabled}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      twofa_enabled: event.target.checked,
                    }))
                  }
                />
                <span className="peer h-6 w-11 rounded-full bg-slate-300 transition-all peer-checked:bg-primary" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-5 peer-checked:bg-white" />
              </label>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Password</p>
          <p className="mt-1 text-xs text-slate-500">
            {hasUsablePassword
              ? 'Change your password below. You will need your current password to confirm the update.'
              : 'You signed in with Google and have no password yet. Set one now so you can also log in with your email and password.'}
          </p>

          {passwordFeedback ? (
            <div
              className={clsx(
                'mt-4 rounded-2xl border px-4 py-3 text-xs',
                passwordFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-600',
              )}
            >
              {passwordFeedback.message}
            </div>
          ) : null}

          <form className="mt-5 grid gap-5 sm:grid-cols-2" onSubmit={handlePasswordSubmit}>
            {hasUsablePassword ? (
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Current password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                  placeholder="Enter your current password"
                />
              </div>
            ) : null}
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                New password
              </label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                placeholder="Enter a new password"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Confirm new password
              </label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                placeholder="Re-enter the new password"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {passwordSubmitting ? 'Saving...' : hasUsablePassword ? 'Update password' : 'Set password'}
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-sm font-semibold text-slate-900">Verification status</p>
          <p className="mt-1 text-xs text-slate-500">
            Monitor your identity verification and AML checks to keep investment access uninterrupted.
          </p>

          <div className="mt-4 space-y-3 text-xs text-slate-600">
            <p>
              <span className="font-semibold text-slate-700">Email verification:</span>{' '}
              {user?.is_email_verified ? 'Verified' : 'Pending'}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Membership status:</span>{' '}
              {user?.verification ? user.verification.toUpperCase() : 'PENDING'}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Member since:</span>{' '}
              {user?.date_joined
                ? new Date(user.date_joined).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {loadingCompliance ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-xs text-slate-500">
                Checking compliance status...
              </div>
            ) : complianceTiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-xs text-slate-500">
                Submit your identity verification details in the Legal & Compliance area to activate investments.
              </div>
            ) : (
              complianceTiles.map((tile) => (
                <div key={tile.key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700">{tile.label}</p>
                  <span className={clsx('rounded-pill px-3 py-1 font-semibold', statusTone[tile.status] || statusTone.pending)}>
                    {tile.status.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </InvestorLayout>
  );
};

export default AccountPage;
