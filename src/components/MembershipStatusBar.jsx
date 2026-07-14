import React from 'react';
import clsx from 'clsx';
import { membershipStages } from '../constants/tiers';

const stageGradient = 'from-primary via-mint to-sunshine';

const MembershipStatusBar = ({ activeStage = 'member', className = '' }) => {
  const stageIndex = Math.max(
    0,
    membershipStages.findIndex((stage) => stage.id === activeStage)
  );
  const progress = ((stageIndex + 1) / membershipStages.length) * 100;

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex flex-col gap-4 rounded-3xl bg-white/70 p-6 shadow-card backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Journey Progress
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {membershipStages[stageIndex]?.label || membershipStages[0].label}
            </p>
          </div>
          <span className="rounded-pill bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
            {stageIndex + 1} / {membershipStages.length}
          </span>
        </div>
        <div className="relative h-2 rounded-pill bg-slate-200">
          <div
            className={clsx(
              'absolute inset-y-0 left-0 rounded-pill bg-gradient-to-r',
              stageGradient
            )}
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 flex justify-between">
            {membershipStages.map((stage, index) => {
              const isActive = index <= stageIndex;
              return (
                <div
                  key={stage.id}
                  className={clsx(
                    'relative flex h-full w-px items-center justify-center',
                    index === 0 && 'justify-start',
                    index === membershipStages.length - 1 && 'justify-end'
                  )}
                >
                  <span
                    className={clsx(
                      'h-3 w-3 rounded-full border-2 border-white transition duration-cozy ease-cozy',
                      isActive ? 'bg-primary' : 'bg-slate-300'
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
          {membershipStages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-2">
              <span
                className={clsx(
                  'inline-flex h-2 w-2 rounded-full',
                  stage.id === activeStage ? 'bg-primary' : 'bg-slate-300'
                )}
              />
              <span className="font-medium text-slate-600">{stage.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MembershipStatusBar;
