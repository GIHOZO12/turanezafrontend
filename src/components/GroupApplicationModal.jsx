import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

const yesNoOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unspecified', label: 'Prefer not to say' },
];

const occupationOptions = [
  { value: 'employee', label: 'Employee' },
  { value: 'entrepreneur', label: 'Entrepreneur / Business Owner' },
  { value: 'student', label: 'Student' },
  { value: 'none', label: 'No Occupation' },
  { value: 'other', label: 'Other' },
];

const installmentOptions = [
  { value: 'one', label: 'One installment (100% upfront)' },
  { value: 'two', label: 'Two installments (50% every 6 months)' },
  { value: 'three', label: 'Three installments (33% each)' },
  { value: 'four', label: 'Four installments (25% each)' },
];

const coInvestorOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'unknown', label: 'I will look for them' },
];

const discussionOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'planning', label: 'Planning to' },
];

const goalAlignmentOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure yet' },
];

const communicationOptions = [
  { value: 'whatsapp', label: 'WhatsApp / Telegram' },
  { value: 'phone', label: 'Phone calls' },
  { value: 'in_person', label: 'In-person meetings' },
  { value: 'email', label: 'Email roundups' },
];

const meetingOptions = [
  { value: 'group', label: 'As a group' },
  { value: 'individual', label: 'Individually' },
  { value: 'both', label: 'Both are fine' },
];

const defaultForm = {
  name: '',
  email: '',
  age: '',
  gender: 'unspecified',
  phoneNumber: '',
  location: '',
  occupation: 'employee',
  idNumber: '',
  hasExperience: 'no',
  motivation: '',
  skills: '',
  financialReady: 'no',
  understandsCommitment: 'no',
  confirmationPhrase: '',
  applicationFeePaid: 'no',
  installmentOption: 'one',
  paymentDeadline: '',
  proofOfFunds: null,
  hasCoInvestors: 'unknown',
  discussedWithNetwork: 'planning',
  comfortableWithNetwork: 'no',
  goalAlignment: 'unsure',
  communicationChannels: [],
  meetingPreference: 'group',
  consentAcknowledged: false,
  notes: '',
};

const booleanFromToggle = (value) => value === 'yes';

const GroupApplicationModal = ({ open, group, submitting, onClose, onSubmit }) => {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...defaultForm,
        name: prev.name,
        email: prev.email,
        phoneNumber: prev.phoneNumber,
        location: prev.location,
      }));
      setError(null);
    }
  }, [open]);

  const wordsRemaining = useMemo(() => {
    const countWords = (value) => value.trim().split(/\s+/).filter(Boolean).length;
    return {
      motivation: Math.max(0, 100 - countWords(form.motivation)),
      skills: Math.max(0, 100 - countWords(form.skills)),
    };
  }, [form.motivation, form.skills]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (type === 'checkbox' && name === 'communicationChannels') {
      setForm((prev) => {
        const exists = prev.communicationChannels.includes(value);
        return {
          ...prev,
          communicationChannels: exists
            ? prev.communicationChannels.filter((item) => item !== value)
            : [...prev.communicationChannels, value],
        };
      });
      return;
    }

    if (type === 'checkbox' && name === 'consentAcknowledged') {
      setForm((prev) => ({ ...prev, consentAcknowledged: checked }));
      return;
    }

    if (name === 'proofOfFunds') {
      setForm((prev) => ({ ...prev, proofOfFunds: event.target.files?.[0] || null }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!group) {
      return 'Select a group before submitting.';
    }
    if (!form.name.trim() || !form.email.trim() || !form.phoneNumber.trim()) {
      return 'Name, email, and phone number are required.';
    }
    if (!form.paymentDeadline) {
      return 'Set your expected payment deadline (15 days from approval).';
    }
    if (!form.proofOfFunds) {
      return 'Upload proof of financial capacity (bank statement).';
    }
    if (booleanFromToggle(form.understandsCommitment) && form.confirmationPhrase.trim().toLowerCase() !== 'yes') {
      return 'Type "Yes" in the confirmation box to acknowledge the funding commitment.';
    }
    if (!form.consentAcknowledged) {
      return 'Please confirm the accuracy of the information provided.';
    }
    return null;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = new FormData();
    payload.append('group', group.id);
    payload.append('name', form.name.trim());
    payload.append('email', form.email.trim());
    if (form.age) {
      payload.append('age', form.age);
    }
    payload.append('gender', form.gender);
    payload.append('phone_number', form.phoneNumber.trim());
    payload.append('location', form.location.trim());
    payload.append('occupation', form.occupation);
    payload.append('id_number', form.idNumber.trim());
    payload.append('has_experience', booleanFromToggle(form.hasExperience));
    payload.append('motivation', form.motivation.trim());
    payload.append('skills', form.skills.trim());
    payload.append('financial_ready', booleanFromToggle(form.financialReady));
    payload.append('understands_commitment', booleanFromToggle(form.understandsCommitment));
    payload.append('commitment_confirmation', form.confirmationPhrase.trim().toLowerCase() === 'yes');
    payload.append('application_fee_paid', booleanFromToggle(form.applicationFeePaid));
    payload.append('installment_option', form.installmentOption);
    payload.append('payment_deadline', form.paymentDeadline);
    payload.append('proof_of_funds', form.proofOfFunds);
    payload.append('has_co_investors', form.hasCoInvestors);
    payload.append('discussed_with_network', form.discussedWithNetwork);
    payload.append('comfortable_with_network', booleanFromToggle(form.comfortableWithNetwork));
    payload.append('goal_alignment', form.goalAlignment);
    payload.append('communication_channels', JSON.stringify(form.communicationChannels));
    payload.append('meeting_preference', form.meetingPreference);
    payload.append('consent_acknowledged', form.consentAcknowledged);
    payload.append('notes', form.notes.trim());

    onSubmit(payload);
  };

  if (!open) {
    return null;
  }

  const renderRadioGroup = (name, selected, options) => (
    <div className="mt-2 flex flex-wrap gap-3">
      {options.map((option) => {
        const active = selected === option.value;
        return (
          <label
            key={`${name}-${option.value}`}
            className={clsx(
              'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm',
              active ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-600'
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected === option.value}
              onChange={handleChange}
              className="text-primary focus:ring-primary"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Join Investment Group</p>
            <h2 className="text-xl font-semibold text-slate-900">
              {group ? group.name : 'Investment Group Application'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Submit this application to collaborate with fellow investors. Once approved you will receive an email with
              the refundable $100,000 application fee instructions and access to group chat, governance, and dashboards.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition duration-150 ease-in-out hover:bg-slate-100 hover:text-slate-600"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-name">
                Full name
              </label>
              <input
                id="ga-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                placeholder="Your legal name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-email">
                Email
              </label>
              <input
                id="ga-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                placeholder="Email used to sign in"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-phone">
                Phone number (WhatsApp preferred)
              </label>
              <input
                id="ga-phone"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                placeholder="+2507..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-location">
                Country of residence
              </label>
              <input
                id="ga-location"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                placeholder="e.g. Rwanda"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-age">
                Age
              </label>
              <input
                id="ga-age"
                name="age"
                type="number"
                min="18"
                max="90"
                value={form.age}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-gender">
                Gender
              </label>
              <select
                id="ga-gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-occupation">
                Current occupation
              </label>
              <select
                id="ga-occupation"
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
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-id-number">
                National ID / Passport number
              </label>
              <input
                id="ga-id-number"
                name="idNumber"
                value={form.idNumber}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Experience & Readiness
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Do you have experience in real estate, construction, or community projects?
                </p>
                {renderRadioGroup('hasExperience', form.hasExperience, yesNoOptions)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Are you ready to join this co-investment with fellow investors?
                </p>
                {renderRadioGroup('financialReady', form.financialReady, yesNoOptions)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Do you understand the sample project commitment ($45,000,000 over 2 years)?
                </p>
                {renderRadioGroup('understandsCommitment', form.understandsCommitment, yesNoOptions)}
                <input
                  name="confirmationPhrase"
                  value={form.confirmationPhrase}
                  onChange={handleChange}
                  placeholder='Type "Yes" to acknowledge'
                  className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  required={booleanFromToggle(form.understandsCommitment)}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Have you already paid the refundable $100,000 application fee?
                </p>
                {renderRadioGroup('applicationFeePaid', form.applicationFeePaid, yesNoOptions)}
                <p className="mt-2 text-xs text-slate-500">
                  The fee remains refundable if settled within 15 days of approval or before allocation.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-motivation">
                Motivation (max 100 words)
              </label>
              <textarea
                id="ga-motivation"
                name="motivation"
                value={form.motivation}
                onChange={handleChange}
                className="mt-2 h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
              <p className="mt-1 text-xs text-slate-400">{wordsRemaining.motivation} words remaining</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-skills">
                Skills & contributions (max 100 words)
              </label>
              <textarea
                id="ga-skills"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                className="mt-2 h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
              <p className="mt-1 text-xs text-slate-400">{wordsRemaining.skills} words remaining</p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-installments">
                Preferred installment plan
              </label>
              <select
                id="ga-installments"
                name="installmentOption"
                value={form.installmentOption}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              >
                {installmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-deadline">
                Expected payment deadline
              </label>
              <input
                id="ga-deadline"
                name="paymentDeadline"
                type="date"
                value={form.paymentDeadline}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
              <p className="mt-2 text-xs text-slate-500">
                Payments must clear within 15 days of approval otherwise the application expires automatically.
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-proof">
                Proof of financial capacity (bank statement)
              </label>
              <input
                id="ga-proof"
                name="proofOfFunds"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm"
              />
              <p className="mt-1 text-xs text-slate-400">Accepted formats: PDF, JPG, or PNG.</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ga-notes">
                Additional notes (optional)
              </label>
              <textarea
                id="ga-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="mt-2 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white px-4 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Co-investor fit & communication
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Do you have co-investors in mind?
                </label>
                <select
                  name="hasCoInvestors"
                  value={form.hasCoInvestors}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                >
                  {coInvestorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Have you discussed this opportunity with them?
                </label>
                <select
                  name="discussedWithNetwork"
                  value={form.discussedWithNetwork}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                >
                  {discussionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Would you feel comfortable forming a co-investment group with them?
                </p>
                {renderRadioGroup('comfortableWithNetwork', form.comfortableWithNetwork, yesNoOptions)}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Do your co-investors share a similar vision?
                </label>
                <select
                  name="goalAlignment"
                  value={form.goalAlignment}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                >
                  {goalAlignmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-900">Preferred communication channels</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {communicationOptions.map((option) => {
                  const checked = form.communicationChannels.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={clsx(
                        'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm',
                        checked ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-600'
                      )}
                    >
                      <input
                        type="checkbox"
                        name="communicationChannels"
                        value={option.value}
                        checked={checked}
                        onChange={handleChange}
                        className="text-primary focus:ring-primary"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Briefing / webinar preference
              </label>
              {renderRadioGroup('meetingPreference', form.meetingPreference, meetingOptions)}
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <input
              id="ga-consent"
              name="consentAcknowledged"
              type="checkbox"
              checked={form.consentAcknowledged}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <label htmlFor="ga-consent" className="text-xs text-slate-600">
              I confirm the information is accurate. I understand that providing incorrect information may trigger
              remedial action under the collaboration deed of the investment group.
            </label>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Approval converts you into an investor member. Expect an automated confirmation email and onboarding
              guidance from Urban Evolution Group.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-pill px-4 py-2 text-sm font-semibold text-slate-500 transition duration-150 ease-in-out hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={clsx(
                  'rounded-pill px-5 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-in-out',
                  submitting ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
                )}
              >
                {submitting ? 'Submitting...' : 'Submit application'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupApplicationModal;
