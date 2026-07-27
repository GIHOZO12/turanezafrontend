import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  confirmPasswordReset,
  fetchCurrentUser,
  loginUser,
  loginWithGoogle,
  requestPasswordReset,
  resendVerification,
  signupUser,
  verifyEmail,
} from "../api/users";
import { membershipStages } from "../constants/tiers";

// Module-level (not component-level) so it survives AuthPage remounting —
// window.google.accounts.id is a page-wide singleton and must only ever be
// initialize()'d once per page load, regardless of React component lifecycle.
let googleIdentityInitialized = false;
let googleScriptLoading = false;
const googleCredentialCallbackHolder = { current: null };

const signupDefaults = { fullName: "", email: "", phone: "", password: "", confirmPassword: "" };
const loginDefaults = { email: "", password: "" };
const resetDefaults = { password: "", confirmPassword: "" };
const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-porcelain px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30";
const primaryButtonClass = "w-full rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-white shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70";
const stageStyles = {
  green: { border: "border-emerald-300", badge: "bg-emerald-600", soft: "bg-emerald-50", text: "text-emerald-700" },
  blue: { border: "border-primary/40", badge: "bg-primary", soft: "bg-blue-50", text: "text-primary" },
  amber: { border: "border-orange-300", badge: "bg-orange-500", soft: "bg-orange-50", text: "text-orange-600" },
  violet: { border: "border-violet-300", badge: "bg-violet-600", soft: "bg-violet-50", text: "text-violet-700" },
  teal: { border: "border-teal-300", badge: "bg-teal-600", soft: "bg-teal-50", text: "text-teal-700" },
};
const journeyStages = [
  { id: 1, title: "Sign Up / Login", tone: "green", detail: "Create an account, verify email, and prepare for KYC onboarding." },
  { id: 2, title: "Become a Member", tone: "blue", detail: "Pay the commitment fee and move from Visitor to Member status." },
  { id: 3, title: "Exploration & Education", tone: "amber", detail: "Study group rules, designs, legal standards, and investor responsibilities." },
  { id: 4, title: "Create or Join a Group", tone: "violet", detail: "Launch a new investment group or join one that matches your goals." },
  { id: 5, title: "Understand & Sign Compliance", tone: "teal", detail: "Review legal agreements, confirm compliance, and accept platform standards." },
  { id: 6, title: "Pay Construction Contribution", tone: "teal", detail: "Track staged contributions and unlock investor badge upgrades." },
  { id: 7, title: "Pay Project Management Fee", tone: "amber", detail: "Settle the 5% management fee generated from the project building cost." },
  { id: 8, title: "Become a Property Owner", tone: "blue", detail: "Receive unit or house ownership confirmation when all obligations are complete." },
  { id: 9, title: "Congratulations", tone: "green", detail: "Download final documents and enter the TURANEZA community as an owner." },
];
const educationHighlights = [
  "Explore available investment groups",
  "Read group guidelines and investor rules",
  "Review architectural designs and layouts",
  "Choose a suitable house or apartment design",
  "Accept legal, compliance, and investor obligations",
];
const investorTiers = [
  { label: "Silver Investor", fraction: "1/4 paid", accent: "from-slate-500 to-slate-300" },
  { label: "Golden Investor", fraction: "2/4 paid", accent: "from-amber-500 to-yellow-300" },
  { label: "Diamond Investor", fraction: "3/4 paid", accent: "from-sky-500 to-cyan-300" },
  { label: "Platinum Investor", fraction: "4/4 paid", accent: "from-slate-300 to-slate-100" },
];
const journeyFeatureCards = [
  { title: "Design Gallery", copy: "Browse house and apartment concepts before joining a group.", icon: "owner" },
  { title: "Document Review", copy: "Open guidelines, legal files, and compliance PDFs in one place.", icon: "compliance" },
  { title: "Contribution Dashboard", copy: "Track installments, invoices, history, and investor badge upgrades.", icon: "payment" },
  { title: "Group Collaboration", copy: "Create or join groups with discussions, limits, and shared milestones.", icon: "group" },
];

const normaliseTier = (role) => membershipStages.find((stage) => stage.id === role)?.id || "member";

const getPostLoginRoute = (user) => {
  if (!user) return "/dashboard";
  if (user.is_super_admin) return "/super-admin";
  if (user.role === "admin" || user.role === "compliance" || user.is_staff || user.is_superuser) {
    return "/admin/dashboard";
  }
  return "/dashboard";
};

// Only allow same-site relative paths (e.g. "/groups/create"), never an absolute
// or protocol-relative URL, to avoid an open-redirect via a crafted ?next= value.
const isSafeNextPath = (path) => Boolean(path) && path.startsWith("/") && !path.startsWith("//") && !path.includes("://");

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.2 8.6 3.2l6.4-6.4C34.8 2.4 29.7 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.5 5.8C12 13.5 17.6 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.7-.4-3.9H24v7.4h12.8c-.3 2-1.6 5-4.6 7l7.1 5.5c4.2-3.9 6.2-9.6 6.2-16z" />
    <path fill="#FBBC05" d="M10.1 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.5-5.8C.9 16.9 0 20.3 0 24s.9 7.1 2.6 10.5l7.5-5.8z" />
    <path fill="#34A853" d="M24 48c5.7 0 10.5-1.9 14-5.1l-7.1-5.5c-1.9 1.3-4.5 2.2-6.9 2.2-6.4 0-12-4-13.9-9.6l-7.5 5.8C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const JourneyBadgeIcon = ({ type }) => {
  if (type === "member") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M8 11a2 2 0 1 1 4 0a2 2 0 0 1-4 0Z" />
        <path d="M6.5 16c.9-1.7 2.4-2.5 4.5-2.5S14.6 14.3 15.5 16" />
        <path d="m16.5 13.5 1.5 1.5 3-3" />
      </svg>
    );
  }
  if (type === "explore") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.2-4.2" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    );
  }
  if (type === "group") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 11a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Zm8 0a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z" />
        <path d="M3.5 18c.6-2.2 2.2-3.5 4.5-3.5S12 15.8 12.5 18" />
        <path d="M11.5 18c.6-2.2 2.2-3.5 4.5-3.5s3.9 1.3 4.5 3.5" />
      </svg>
    );
  }
  if (type === "compliance") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 3h6l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    );
  }
  if (type === "payment") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
        <path d="M7 12h10" />
        <path d="M9 4h6" />
      </svg>
    );
  }
  if (type === "owner") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="m3 11 9-7 9 7" />
        <path d="M5 10.5V20h14v-9.5" />
        <path d="M10 20v-5h4v5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3v18M3 12h18" />
    </svg>
  );
};

const JourneyStageCard = ({ stage }) => {
  const style = stageStyles[stage.tone];
  return (
    <div className={clsx("rounded-[26px] border bg-white/90 p-5 shadow-card backdrop-blur-sm", style.border)}>
      <div className="flex items-start gap-4">
        <span className={clsx("inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white shadow-lg", style.badge)}>
          {stage.id}
        </span>
        <div className="space-y-2">
          <p className={clsx("text-sm font-semibold uppercase tracking-[0.2em]", style.text)}>{stage.title}</p>
          <p className="text-sm leading-7 text-slate-600">{stage.detail}</p>
        </div>
      </div>
    </div>
  );
};

const InvestmentJourneyPanel = () => (
  <section className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/85 p-6 shadow-card backdrop-blur-sm sm:p-8 lg:p-10">
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(30,136,229,0.16),_transparent_30%),radial-gradient(circle_at_85%_10%,_rgba(251,191,36,0.18),_transparent_24%),radial-gradient(circle_at_50%_100%,_rgba(52,211,153,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,248,252,0.96))]" aria-hidden="true" />
    <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" aria-hidden="true" />

    <div className="grid gap-8 xl:grid-cols-[1.2fr,0.8fr]">
      <div className="space-y-8">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-pill border border-primary/15 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-primary">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
            TURANEZA App
          </div>
          <div className="space-y-3">
            <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl lg:text-[2.6rem]">
              Investment Journey Progress
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              A guided path from registration to ownership, with a clearer view of membership, education, compliance, contributions, and final property transfer.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-primary/15 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Journey Length</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">9 stages</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Structured onboarding to ownership.</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Investor Tiers</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">4 levels</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Silver to Platinum contribution milestones.</p>
            </div>
            <div className="rounded-2xl border border-orange-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Core Focus</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">Compliance</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Legal clarity and controlled access at each step.</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute bottom-0 left-[21px] top-0 hidden w-px bg-gradient-to-b from-primary/40 via-teal-300 to-emerald-300 lg:block" aria-hidden="true" />
          <div className="space-y-4">
            {journeyStages.map((stage) => (
              <div key={stage.id} className="relative lg:pl-16">
                <div className="absolute left-0 top-5 hidden lg:block">
                  <span className={clsx("inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ring-4 ring-white", stageStyles[stage.tone].badge)}>
                    {stage.id}
                  </span>
                </div>
                <JourneyStageCard stage={stage} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className={clsx("rounded-[28px] border p-6 shadow-card", stageStyles.amber.border, stageStyles.amber.soft)}>
          <div className="flex items-start gap-4">
            <span className={clsx("inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg", stageStyles.amber.badge)}>
              <JourneyBadgeIcon type="explore" />
            </span>
            <div className="space-y-2">
              <p className={clsx("text-sm font-semibold uppercase tracking-[0.2em]", stageStyles.amber.text)}>Exploration & Education</p>
              <p className="text-sm leading-7 text-slate-600">Help aspiring investors learn before they commit, with visible design, rules, and legal preparation.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {educationHighlights.map((item, index) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-white/85 px-4 py-3">
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 px-5 py-4 text-center text-sm font-semibold text-slate-800">
            You become an Aspiring Investor
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {journeyFeatureCards.map((card) => (
            <div key={card.title} className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-card">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <JourneyBadgeIcon type={card.icon} />
              </span>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-800">{card.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.copy}</p>
            </div>
          ))}
        </div>

        <div className={clsx("rounded-[28px] border p-6 shadow-card", stageStyles.teal.border)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={clsx("text-sm font-semibold uppercase tracking-[0.2em]", stageStyles.teal.text)}>Contribution Milestones</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">Construction contributions unlock investor recognition step by step.</p>
            </div>
            <span className="rounded-pill bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">4 tiers</span>
          </div>
          <div className="mt-5 space-y-4">
            {investorTiers.map((tier, index) => (
              <div key={tier.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-800">{tier.label}</p>
                    <p className="mt-1 text-xs text-slate-500">Unlocked when the investor reaches {tier.fraction.replace(" paid", "")} of the construction target.</p>
                  </div>
                  <span className={clsx("inline-flex h-11 min-w-[5.5rem] items-center justify-center rounded-xl bg-gradient-to-r px-3 text-sm font-semibold text-white shadow-sm", tier.accent)}>
                    {tier.fraction}
                  </span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div className={clsx("h-full rounded-full bg-gradient-to-r", tier.accent)} style={{ width: `${(index + 1) * 25}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-emerald-200 bg-white/90 p-6 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Journey Summary</p>
          <div className="mt-4 grid gap-3">
            {journeyStages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <span className={clsx("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", stageStyles[stage.tone].badge)}>
                  {stage.id}
                </span>
                <p className="text-sm leading-6 text-slate-600">{stage.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const resetEmailFromQuery = queryParams.get("email") || "";
  const nextPath = queryParams.get("next") || "";
  const resolvePostLoginRoute = (user) => (isSafeNextPath(nextPath) ? nextPath : getPostLoginRoute(user));

  const [mode, setMode] = useState("login");
  const [activeTier, setActiveTier] = useState("member");
  const [signupForm, setSignupForm] = useState(signupDefaults);
  const [loginForm, setLoginForm] = useState(loginDefaults);
  const [resetRequestEmail, setResetRequestEmail] = useState("");
  const [resetForm, setResetForm] = useState(resetDefaults);
  const [resetStep, setResetStep] = useState("email");
  const [resetCode, setResetCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resetRequestLoading, setResetRequestLoading] = useState(false);
  const [resetConfirmLoading, setResetConfirmLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  const verificationSectionRef = useRef(null);
  const verificationInputRef = useRef(null);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const requestedMode = queryParams.get("mode");
    if (requestedMode === "signup") return setMode("signup");
    if (requestedMode === "reset") {
      setMode("reset");
      if (resetEmailFromQuery) setResetRequestEmail(resetEmailFromQuery);
      return;
    }
    setMode("login");
  }, [queryParams, resetEmailFromQuery]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setProfile(currentUser);
          setActiveTier(normaliseTier(currentUser.role));
        }
      } catch {}
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (profile && !needsVerification) navigate(resolvePostLoginRoute(profile), { replace: true });
  }, [profile, needsVerification, navigate]);

  useEffect(() => {
    if (!needsVerification) return;
    setMode("login");
    window.requestAnimationFrame(() => {
      verificationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      verificationInputRef.current?.focus();
    });
  }, [needsVerification]);

  const extractErrorMessage = (error, fallback) => {
    const payload = error?.payload;
    if (payload && typeof payload === "object") {
      const fieldErrors = Object.entries(payload)
        .filter(([, value]) => Array.isArray(value))
        .map(([key, value]) => `${key}: ${value.join(" ")}`);
      if (fieldErrors.length) return fieldErrors.join(" | ");
      if (typeof payload.detail === "string") return payload.detail;
      if (typeof payload.error === "string") return payload.error;
      if (typeof payload.message === "string") return payload.message;
    }
    return error?.message || fallback;
  };

  const captureProfile = async () => {
    try {
      const currentUser = await fetchCurrentUser();
      if (currentUser) {
        setProfile(currentUser);
        setActiveTier(normaliseTier(currentUser.role));
      }
      return currentUser;
    } catch {
      return null;
    }
  };

  const setQueryMode = (nextMode, extra = "") => {
    setMode(nextMode);
    navigate(`/auth?mode=${nextMode}${extra}`, { replace: true });
  };

  const resetTransientState = () => {
    setFeedback(null);
    setNeedsVerification(false);
    setPendingEmail("");
    setVerificationCode("");
    setResetForm(resetDefaults);
    setResetStep("email");
    setResetCode("");
  };

  const handleTabChange = (nextMode) => {
    resetTransientState();
    setQueryMode(nextMode);
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    if (signupForm.password !== signupForm.confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }
    setFormLoading(true);
    try {
      await signupUser({
        full_name: signupForm.fullName.trim(),
        email: signupForm.email.trim(),
        phone: signupForm.phone.replace(/\D/g, ""),
        password: signupForm.password,
      });
      const refreshed = await captureProfile();
      if (refreshed) return navigate(resolvePostLoginRoute(refreshed), { replace: true });
      setPendingEmail(signupForm.email.trim());
      setNeedsVerification(true);
      setVerificationCode("");
      setFeedback({ type: "success", message: "Account created. Enter the 6-digit code sent to your email to verify your membership." });
    } catch (error) {
      setFeedback({ type: "error", message: extractErrorMessage(error, "Unable to complete signup right now.") });
    } finally {
      setFormLoading(false);
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setFormLoading(true);
    try {
      await loginUser({ email: loginForm.email.trim(), password: loginForm.password });
      const refreshed = await captureProfile();
      setNeedsVerification(false);
      if (refreshed) navigate(resolvePostLoginRoute(refreshed), { replace: true });
    } catch (error) {
      const message = (error?.message || "").toLowerCase();
      if (message.includes("verification")) {
        setNeedsVerification(true);
        setPendingEmail(loginForm.email.trim());
        setFeedback({ type: "info", message: "Your email still needs verification. Enter the 6-digit code we emailed to you." });
      } else {
        setFeedback({ type: "error", message: extractErrorMessage(error, "We could not sign you in. Check your email and password, or reset your password if needed.") });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleForgotPassword = () => {
    resetTransientState();
    const email = loginForm.email.trim();
    if (email) setResetRequestEmail(email);
    setQueryMode("reset", email ? `&email=${encodeURIComponent(email)}` : "");
  };

  const handleResetRequestSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setResetRequestLoading(true);
    try {
      await requestPasswordReset({ email: resetRequestEmail.trim() });
      setResetCode("");
      setResetStep("code");
      setFeedback({ type: "success", message: "If an account with that email exists, a 6-digit reset code has been sent to it." });
    } catch (error) {
      setFeedback({ type: "error", message: extractErrorMessage(error, "Unable to send a password reset code right now.") });
    } finally {
      setResetRequestLoading(false);
    }
  };

  const handleResendResetCode = async () => {
    if (!resetRequestEmail.trim()) return setFeedback({ type: "error", message: "Provide an email before requesting a new code." });
    setResetRequestLoading(true);
    try {
      await requestPasswordReset({ email: resetRequestEmail.trim() });
      setFeedback({ type: "success", message: "A new 6-digit reset code has been sent to your email." });
    } catch (error) {
      setFeedback({ type: "error", message: extractErrorMessage(error, "Unable to resend the reset code right now.") });
    } finally {
      setResetRequestLoading(false);
    }
  };

  const handleResetCodeSubmit = (event) => {
    event.preventDefault();
    setFeedback(null);
    if (!/^[0-9]{6}$/.test(resetCode.trim())) {
      setFeedback({ type: "error", message: "Reset code must be exactly 6 digits." });
      return;
    }
    setResetStep("password");
  };

  const handleResetConfirmSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    if (resetForm.password !== resetForm.confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }
    setResetConfirmLoading(true);
    try {
      await confirmPasswordReset({
        email: resetRequestEmail.trim(),
        code: resetCode.trim(),
        password: resetForm.password,
        confirm_password: resetForm.confirmPassword,
      });
      setResetForm(resetDefaults);
      setFeedback({ type: "success", message: "Password updated successfully. You can now log in with your new password." });
      setQueryMode("login");
    } catch (error) {
      setFeedback({ type: "error", message: extractErrorMessage(error, "That code is invalid or has expired. Go back and request a new one.") });
    } finally {
      setResetConfirmLoading(false);
    }
  };

  const handleVerificationSubmit = async (event) => {
    event.preventDefault();
    if (!pendingEmail) return setFeedback({ type: "error", message: "Enter your email first." });
    if (!/^[0-9]{6}$/.test(verificationCode.trim())) {
      return setFeedback({ type: "error", message: "Verification code must be exactly 6 digits." });
    }
    setVerifyLoading(true);
    try {
      await verifyEmail({ email: pendingEmail, code: verificationCode.trim() });
      const refreshed = await captureProfile();
      setNeedsVerification(false);
      if (refreshed) navigate(resolvePostLoginRoute(refreshed), { replace: true });
    } catch (error) {
      setFeedback({ type: "error", message: extractErrorMessage(error, "Invalid verification code.") });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingEmail) return setFeedback({ type: "error", message: "Provide an email before requesting a new code." });
    setResendLoading(true);
    try {
      await resendVerification({ email: pendingEmail });
      setFeedback({ type: "success", message: "A new 6-digit code has been sent to your email." });
    } catch (error) {
      setFeedback({ type: "error", message: extractErrorMessage(error, "Unable to resend code right now.") });
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const base = import.meta.env.VITE_API_BASE_URL || "";
    window.location.href = `${base}/api/v1/users/google/login`;
  };

  useEffect(() => {
    if (mode === "reset" || !googleClientId) return;
    // Google logs a warning if initialize() is called more than once per page
    // load, so we track that at module scope (survives this component
    // remounting) and route the credential callback through a holder that
    // always reflects the latest mode.
    googleCredentialCallbackHolder.current = async (response) => {
      if (!response?.credential) return setFeedback({ type: "error", message: "Google sign-in did not return a credential." });
      setFeedback(null);
      setFormLoading(true);
      try {
        await loginWithGoogle({ credential: response.credential, mode });
        const refreshed = await captureProfile();
        setNeedsVerification(false);
        if (refreshed) navigate(resolvePostLoginRoute(refreshed), { replace: true });
      } catch (error) {
        setFeedback({ type: "error", message: extractErrorMessage(error, "Google sign-in failed.") });
      } finally {
        setFormLoading(false);
      }
    };

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      if (!googleIdentityInitialized) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => googleCredentialCallbackHolder.current?.(response),
          auto_select: false,
        });
        googleIdentityInitialized = true;
      }
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline", size: "large", shape: "pill", text: mode === "signup" ? "signup_with" : "signin_with", width: 360,
      });
      setGoogleError(null);
    };
    if (window.google?.accounts?.id) return renderGoogleButton();
    if (googleScriptLoading) return;
    googleScriptLoading = true;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setGoogleError("Unable to load Google sign-in.");
    document.body.appendChild(script);
  }, [googleClientId, mode, navigate]);

  const activeStageLabel = useMemo(() => membershipStages.find((item) => item.id === activeTier)?.label || membershipStages[0].label, [activeTier]);
  const authTitle =
    mode === "signup"
      ? "Create your member profile"
      : mode === "reset"
      ? resetStep === "password"
        ? "Choose a new password"
        : resetStep === "code"
        ? "Enter your reset code"
        : "Reset your password"
      : "Log into your account";
  const renderGoogleFallback = () => (
    <>
      {googleClientId && !googleError ? (
        <div className="flex w-full justify-center"><div ref={googleButtonRef} className="w-full max-w-sm" /></div>
      ) : (
        <button type="button" onClick={handleGoogleAuth} className="flex w-full items-center justify-center gap-3 rounded-pill border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary">
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>
      )}
      {googleError && <p className="text-xs text-slate-500">{googleError} You can still use the redirect sign-in.</p>}
    </>
  );

  return (
    <div className="bg-porcelain text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/urban_evolution_group_logo.png" alt="Urban Evolution Group" className="h-12 w-12 rounded-2xl object-contain shadow-card" />
            <div><p className="text-lg font-semibold text-slate-900">Urban Evolution Group</p><p className="text-sm text-slate-500">Turaneza App</p></div>
          </div>
          <button type="button" onClick={() => navigate("/", { replace: false })} className="inline-flex items-center rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary">Back to welcome page</button>
        </header>
        <div className="flex flex-1 flex-col gap-10 pb-16">
          <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary">Join Urban Evolution Group</p>
                <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{authTitle}</h2>
              </div>
              <span className="rounded-pill bg-sunshine/20 px-4 py-2 text-xs font-semibold text-sunshine">{mode === "reset" ? "Secure recovery" : "Stay signed in for 7 days"}</span>
            </div>

            <div className="flex rounded-pill bg-porcelain p-1 text-sm font-semibold text-slate-500">
              {["login", "signup"].map((item) => (
                <button key={item} type="button" onClick={() => handleTabChange(item)} className={clsx("flex-1 rounded-pill px-4 py-2 transition duration-cozy ease-cozy", mode === item ? "bg-white text-primary shadow-card" : "hover:text-primary")}>{item === "login" ? "Login" : "Register"}</button>
              ))}
            </div>

            {mode === "reset" && <button type="button" onClick={() => handleTabChange("login")} className="w-fit text-sm font-semibold text-primary transition duration-cozy ease-cozy hover:text-primary/80">Back to login</button>}

            {feedback && <div className={clsx("rounded-2xl border px-4 py-3 text-sm", feedback.type === "success" && "border-mint/40 bg-mint/10 text-mint", feedback.type === "error" && "border-red-200 bg-red-50 text-red-600", feedback.type === "info" && "border-primary/30 bg-primary/10 text-primary")}>{feedback.message}</div>}

            {mode === "signup" && (
              <form onSubmit={handleSignupSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label htmlFor="fullName" className="text-sm font-semibold text-slate-600">Full Name</label><input id="fullName" name="fullName" type="text" required value={signupForm.fullName} onChange={(e) => setSignupForm((prev) => ({ ...prev, fullName: e.target.value }))} placeholder="Enter your full name" className={inputClass} /></div>
                  <div><label htmlFor="email" className="text-sm font-semibold text-slate-600">Email Address</label><input id="email" name="email" type="email" required value={signupForm.email} onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="name@example.com" className={inputClass} /></div>
                  <div><label htmlFor="phone" className="text-sm font-semibold text-slate-600">Phone Number</label><input id="phone" name="phone" type="tel" required value={signupForm.phone} onChange={(e) => setSignupForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="+250 700 000 000" className={inputClass} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label htmlFor="password" className="text-sm font-semibold text-slate-600">Password</label><input id="password" name="password" type="password" required value={signupForm.password} onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Create a strong password" className={inputClass} /></div>
                  <div><label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-600">Confirm Password</label><input id="confirmPassword" name="confirmPassword" type="password" required value={signupForm.confirmPassword} onChange={(e) => setSignupForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Re-enter password" className={inputClass} /></div>
                </div>
                <button type="submit" disabled={formLoading} className={primaryButtonClass}>{formLoading ? "Creating account..." : "Create Account"}</button>
                {renderGoogleFallback()}
              </form>
            )}

            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div><label htmlFor="loginEmail" className="text-sm font-semibold text-slate-600">Email Address</label><input id="loginEmail" name="email" type="email" required value={loginForm.email} onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="name@example.com" className={inputClass} /></div>
                  <div>
                    <div className="flex items-center justify-between gap-3"><label htmlFor="loginPassword" className="text-sm font-semibold text-slate-600">Password</label><button type="button" onClick={handleForgotPassword} className="text-xs font-semibold text-primary transition duration-cozy ease-cozy hover:text-primary/80">Forgot password?</button></div>
                    <input id="loginPassword" name="password" type="password" required value={loginForm.password} onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Enter your password" className={inputClass} />
                  </div>
                </div>
                <button type="submit" disabled={formLoading} className={primaryButtonClass}>{formLoading ? "Signing in..." : "Login"}</button>
                {renderGoogleFallback()}
              </form>
            )}

            {mode === "reset" && resetStep === "email" && (
              <form onSubmit={handleResetRequestSubmit} className="space-y-5">
                <div className="rounded-2xl bg-porcelain p-4 text-sm text-slate-600">Enter the email address linked to your account and we will send you a 6-digit reset code.</div>
                <div><label htmlFor="resetEmail" className="text-sm font-semibold text-slate-600">Email Address</label><input id="resetEmail" type="email" required value={resetRequestEmail} onChange={(e) => setResetRequestEmail(e.target.value)} placeholder="name@example.com" className={inputClass} /></div>
                <button type="submit" disabled={resetRequestLoading} className={primaryButtonClass}>{resetRequestLoading ? "Sending code..." : "Send reset code"}</button>
              </form>
            )}

            {mode === "reset" && resetStep === "code" && (
              <form onSubmit={handleResetCodeSubmit} className="space-y-5">
                <div className="rounded-2xl bg-porcelain p-4 text-sm text-slate-600">Enter the 6-digit code sent to <span className="font-semibold text-slate-700">{resetRequestEmail}</span>.</div>
                <div>
                  <label htmlFor="resetCode" className="text-sm font-semibold text-slate-600">Reset Code</label>
                  <input id="resetCode" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="123456" value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ""))} className={clsx(inputClass, "text-center text-lg font-semibold tracking-[0.5em]")} />
                </div>
                <button type="submit" className={primaryButtonClass}>Continue</button>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <button type="button" onClick={() => setResetStep("email")} className="font-semibold text-primary transition duration-cozy ease-cozy hover:text-primary/80">Wrong email? Go back</button>
                  <button type="button" onClick={handleResendResetCode} disabled={resetRequestLoading} className="font-semibold text-primary transition duration-cozy ease-cozy hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-70">{resetRequestLoading ? "Resending..." : "Resend code"}</button>
                </div>
              </form>
            )}

            {mode === "reset" && resetStep === "password" && (
              <form onSubmit={handleResetConfirmSubmit} className="space-y-5">
                <div className="rounded-2xl bg-porcelain p-4 text-sm text-slate-600">Choose a new password for your account.</div>
                <div><label htmlFor="resetPassword" className="text-sm font-semibold text-slate-600">New Password</label><input id="resetPassword" name="password" type="password" required value={resetForm.password} onChange={(e) => setResetForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Enter a new password" className={inputClass} /></div>
                <div><label htmlFor="resetConfirmPassword" className="text-sm font-semibold text-slate-600">Confirm New Password</label><input id="resetConfirmPassword" name="confirmPassword" type="password" required value={resetForm.confirmPassword} onChange={(e) => setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Re-enter your new password" className={inputClass} /></div>
                <button type="submit" disabled={resetConfirmLoading} className={primaryButtonClass}>{resetConfirmLoading ? "Updating password..." : "Save new password"}</button>
                <button type="button" onClick={() => setResetStep("code")} className="w-fit text-xs font-semibold text-primary transition duration-cozy ease-cozy hover:text-primary/80">Entered the wrong code? Go back</button>
              </form>
            )}

            {needsVerification && (
              <div ref={verificationSectionRef} className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-semibold text-primary">Verify your email</p><p className="text-xs text-slate-500">Enter the 6-digit code sent to <span className="font-semibold text-slate-700">{pendingEmail}</span></p></div>
                  <button type="button" onClick={handleResendCode} disabled={resendLoading} className="rounded-pill border border-primary/40 px-3 py-1 text-xs font-semibold text-primary transition duration-cozy ease-cozy hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70">{resendLoading ? "Resending..." : "Resend code"}</button>
                </div>
                <form onSubmit={handleVerificationSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="123456" value={verificationCode} ref={verificationInputRef} onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))} className="flex-1 rounded-xl border border-primary/40 bg-white px-4 py-3 text-center text-lg font-semibold tracking-[0.5em] text-slate-900 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30" />
                  <button type="submit" disabled={verifyLoading} className="rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-white shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70">{verifyLoading ? "Verifying..." : "Confirm Code"}</button>
                </form>
              </div>
            )}

            {profile && <div className="space-y-3 rounded-2xl border border-mint/40 bg-mint/10 p-5 text-sm text-slate-700"><p className="text-sm font-semibold text-mint">You are signed in as {profile.full_name || profile.email}</p><p className="text-xs text-slate-500">Current tier: <span className="font-semibold text-slate-700">{activeStageLabel}</span></p></div>}
          </section>

          <InvestmentJourneyPanel />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

