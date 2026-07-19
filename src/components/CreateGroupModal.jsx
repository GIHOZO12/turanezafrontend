import React, { useMemo } from 'react';
import clsx from 'clsx';

const CreateGroupModal = ({ open, onClose, onProceed, userRole }) => {
  const roleLabel = useMemo(() => {
    if (!userRole) {
      return 'investor';
    }
    return userRole.toLowerCase();
  }, [userRole]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Group Creator Guide</p>
            <h2 className="text-lg font-semibold text-slate-900">Launch an investment circle in three steps</h2>
            <p className="mt-1 text-xs text-slate-500">
              Every logged-in member can establish a new group. A quick review by the Urban Evolution Group team
              follows to confirm the onboarding details.
            </p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition duration-150 ease-in-out hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-primary">If you&apos;re exploring group leadership</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li>Define the impact or portfolio focus you want the group to pursue.</li>
              <li>Confirm you can coordinate onboarding calls and updates with other members.</li>
                  <li>Review the RWF 100,000 commitment and timeline expectations with the UEG team.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">If you&apos;re already an active {roleLabel}</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li>Gather a short mission statement that other investors can rally behind.</li>
              <li>Decide on preliminary coordination tools such as chat, meetings, and updates.</li>
              <li>Invite co-investors after we confirm the group and share the onboarding checklist.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white px-4 py-3 text-xs text-slate-600 shadow-inner">
          <p>
            Need inspiration? Explore existing groups for tone and structure, then return here when you&apos;re ready.
            You can submit the form now and refine details with the UEG team during onboarding.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill px-4 py-2 text-sm font-semibold text-slate-500 transition duration-150 ease-in-out hover:bg-slate-100"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={onProceed}
            className={clsx(
              'rounded-pill px-5 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-in-out',
              'bg-primary hover:bg-primary/90'
            )}
          >
            Continue to form
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
