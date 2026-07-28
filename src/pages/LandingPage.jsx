import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  submitLandingContactForm,
  submitLandingInvestmentInterest,
} from "../api/superadmin";
import { fetchCurrentUser, logoutUser } from "../api/users";
import { fetchProjects, fetchPropertyListings } from "../api/projects";
import { fetchTestimonials, resolveTestimonialImageUrl } from "../api/testimonials";
import { sanitizeUrl } from "../utils/url";
import {
  navigationLinks,
  storyHighlights,
} from "../data/landingContent";
import { usePreferences } from "../context/PreferencesContext";

const GlobeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z" />
  </svg>
);

const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PLOT_FORM_PATH = "/groups/create";

const getDashboardRoute = (user) => {
  if (!user) return "/dashboard";
  if (user.is_super_admin) return "/super-admin";
  if (user.role === "admin" || user.role === "compliance" || user.is_staff || user.is_superuser) {
    return "/admin/dashboard";
  }
  return "/dashboard";
};

const initialInvestmentForm = {
  full_name: "",
  email: "",
  phone_number: "",
  desired_investment: "",
  housing_interest: "affordable",
  notes: "",
};

const initialContactForm = {
  name: "",
  email: "",
  topic: "investor",
  message: "",
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [investmentForm, setInvestmentForm] = useState(initialInvestmentForm);
  const [contactForm, setContactForm] = useState(initialContactForm);
  const [investmentErrors, setInvestmentErrors] = useState({});
  const [contactErrors, setContactErrors] = useState({});
  const [investmentStatus, setInvestmentStatus] = useState({
    loading: false,
    success: "",
    error: "",
  });
  const [contactStatus, setContactStatus] = useState({
    loading: false,
    success: "",
    error: "",
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [latestProjects, setLatestProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const userMenuRef = useRef(null);
  const langMenuRef = useRef(null);
  const { language, languages, setLanguage } = usePreferences();

  useEffect(() => {
    let mounted = true;
    fetchCurrentUser()
      .then((response) => {
        if (mounted) {
          setUser(response);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingUser(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    // /api/v1/projects/projects/ has the `group` id needed to link "View
    // details" to the right group, but not `active_investors` — that only
    // exists on the properties serializer. Fetch both and merge by id.
    Promise.all([fetchProjects({ ordering: "-created_at" }), fetchPropertyListings()])
      .then(([projectsResponse, propertiesResponse]) => {
        if (!mounted) return;
        const list = Array.isArray(projectsResponse?.results)
          ? projectsResponse.results
          : Array.isArray(projectsResponse)
          ? projectsResponse
          : [];
        const propertyList = Array.isArray(propertiesResponse?.results)
          ? propertiesResponse.results
          : Array.isArray(propertiesResponse)
          ? propertiesResponse
          : [];
        const propertyById = new Map(propertyList.map((property) => [property.id, property]));
        const merged = list.map((project) => ({
          ...project,
          active_investors: propertyById.get(project.id)?.active_investors ?? 0,
        }));
        const sorted = [...merged].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setLatestProjects(sorted.slice(0, 3));
      })
      .catch(() => {
        if (mounted) {
          setLatestProjects([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingProjects(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchTestimonials()
      .then((response) => {
        if (!mounted) return;
        const list = Array.isArray(response?.results) ? response.results : Array.isArray(response) ? response : [];
        setTestimonials(list);
      })
      .catch(() => {
        if (mounted) {
          setTestimonials([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingTestimonials(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitials = (user?.full_name || user?.email || "UEG")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
  const userRoleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Member";

  const handleGoToDashboard = () => {
    setUserMenuOpen(false);
    navigate(getDashboardRoute(user));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch (error) {
      // ignore — still clear local state and send them to the login page
    } finally {
      setLoggingOut(false);
      setUserMenuOpen(false);
      setUser(null);
      navigate("/auth", { replace: true });
    }
  };

  const handleStartInvesting = () => {
    if (!loadingUser && !user) {
      navigate(`/auth?next=${encodeURIComponent(PLOT_FORM_PATH)}`);
      return;
    }
    navigate(PLOT_FORM_PATH);
  };

  const validateInvestmentForm = () => {
    const errors = {};
    const investmentAmount = Number(investmentForm.desired_investment);
    const phoneDigits = investmentForm.phone_number.replace(/\D/g, "");

    if (
      !investmentForm.full_name.trim() ||
      investmentForm.full_name.trim().length < 3
    ) {
      errors.full_name = "Enter your full name.";
    }
    if (!investmentForm.email.trim()) {
      errors.email = "Enter your email address.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(investmentForm.email.trim())
    ) {
      errors.email = "Enter a valid email address.";
    }
    if (phoneDigits.length < 9) {
      errors.phone_number = "Enter a valid phone number.";
    }
    if (!investmentForm.desired_investment) {
      errors.desired_investment = "Enter your desired investment amount.";
    } else if (Number.isNaN(investmentAmount) || investmentAmount < 1000) {
      errors.desired_investment = "Minimum investment is $1000.";
    }
    return errors;
  };

  const validateContactForm = () => {
    const errors = {};
    if (!contactForm.name.trim() || contactForm.name.trim().length < 2) {
      errors.name = "Enter your name.";
    }
    if (!contactForm.email.trim()) {
      errors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!contactForm.message.trim() || contactForm.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters.";
    }
    return errors;
  };

  const handleInvestSubmit = async (event) => {
    event.preventDefault();
    const errors = validateInvestmentForm();
    setInvestmentErrors(errors);
    setInvestmentStatus({ loading: false, success: "", error: "" });
    if (Object.keys(errors).length) {
      return;
    }

    setInvestmentStatus({ loading: true, success: "", error: "" });
    try {
      await submitLandingInvestmentInterest({
        ...investmentForm,
        full_name: investmentForm.full_name.trim(),
        email: investmentForm.email.trim(),
        phone_number: investmentForm.phone_number.trim(),
        desired_investment: Number(investmentForm.desired_investment),
        notes: investmentForm.notes.trim(),
      });
      setInvestmentForm(initialInvestmentForm);
      setInvestmentErrors({});
      setInvestmentStatus({
        loading: false,
        success:
          "Your investment interest was sent. Our team will contact you within 48 hours.",
        error: "",
      });
    } catch (error) {
      const fieldErrors = error?.payload || {};
      setInvestmentErrors(
        fieldErrors && typeof fieldErrors === "object" ? fieldErrors : {},
      );
      setInvestmentStatus({
        loading: false,
        success: "",
        error:
          error.message ||
          "Unable to submit your investment interest right now.",
      });
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    const errors = validateContactForm();
    setContactErrors(errors);
    setContactStatus({ loading: false, success: "", error: "" });
    if (Object.keys(errors).length) {
      return;
    }

    setContactStatus({ loading: true, success: "", error: "" });
    try {
      await submitLandingContactForm({
        ...contactForm,
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        message: contactForm.message.trim(),
      });
      setContactForm(initialContactForm);
      setContactErrors({});
      setContactStatus({
        loading: false,
        success:
          "Your message was sent. We will respond within one business day.",
        error: "",
      });
    } catch (error) {
      const fieldErrors = error?.payload || {};
      setContactErrors(
        fieldErrors && typeof fieldErrors === "object" ? fieldErrors : {},
      );
      setContactStatus({
        loading: false,
        success: "",
        error: error.message || "Unable to send your message right now.",
      });
    }
  };

  return (
    <div className="bg-porcelain text-slate-900">
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-card transition duration-cozy ease-cozy hover:scale-105">
                <span className="text-xl font-semibold">UEG</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Urban Evolution Group</p>
                <p className="text-sm text-slate-500">Turaneza App</p>
              </div>
            </div>
            <nav className="hidden items-center gap-8 text-sm font-bold text-slate-700 lg:flex">
              {navigationLinks.map((item) => {
                const isRoute = item.href.startsWith("/");
                return isRoute ? (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="rounded-pill px-3 py-2 transition duration-cozy ease-cozy hover:bg-primary/10 hover:text-primary"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <a
                    key={item.name}
                    href={item.href}
                    className="rounded-pill px-3 py-2 transition duration-cozy ease-cozy hover:bg-primary/10 hover:text-primary"
                  >
                    {item.name}
                  </a>
                );
              })}
            </nav>
            <div className="hidden items-center gap-3 lg:flex">
              {!loadingUser && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-3 rounded-pill border border-slate-200 bg-white px-3 py-2 text-left transition duration-cozy ease-cozy hover:border-primary/60"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {userInitials}
                    </span>
                    <span className="pr-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {user.full_name || user.email}
                      </span>
                      <span className="block text-xs text-slate-500">{userRoleLabel}</span>
                    </span>
                  </button>

                  {userMenuOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white py-2 shadow-xl">
                      <button
                        type="button"
                        onClick={handleGoToDashboard}
                        className="block w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-primary/10 hover:text-primary"
                      >
                        Go to Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="block w-full px-4 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <Link
                    to="/auth?mode=login"
                    className="rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth?mode=signup"
                    className="rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-primary/90"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setLangMenuOpen((prev) => !prev)}
                  aria-label="Language"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary"
                >
                  <GlobeIcon className="h-5 w-5" />
                </button>
                {langMenuOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                    <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Language
                    </p>
                    {languages.map((lang) => {
                      const isActive = lang.code === language;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code);
                            setLangMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                            isActive ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-primary/10 hover:text-primary"
                          }`}
                        >
                          {lang.label}
                          {isActive ? <CheckIcon className="h-4 w-4" /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary lg:hidden"
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
            >
              Menu
            </button>
          </div>
          <div
            id="mobile-nav"
            className={`${
              isMobileNavOpen ? "block" : "hidden"
            } border-t border-slate-100 bg-white lg:hidden`}
          >
            <nav className="mx-auto grid max-w-7xl gap-2 px-4 py-4 sm:px-6 font-semibold">
              {navigationLinks.map((item) => {
                const isRoute = item.href.startsWith("/");
                const commonClass =
                  "rounded-lg px-4 py-3 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:bg-primary/10 hover:text-primary";
                return isRoute ? (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={commonClass}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <a
                    key={item.name}
                    href={item.href}
                    className={commonClass}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    {item.name}
                  </a>
                );
              })}
              {!loadingUser && user ? (
                <div className="mt-2 space-y-2 rounded-lg border border-slate-100 bg-porcelain p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {userInitials}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {user.full_name || user.email}
                      </span>
                      <span className="block text-xs text-slate-500">{userRoleLabel}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      handleGoToDashboard();
                    }}
                    className="w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition duration-cozy ease-cozy hover:bg-primary/90"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      handleLogout();
                    }}
                    disabled={loggingOut}
                    className="w-full rounded-lg border border-rose-200 px-4 py-3 text-center text-sm font-semibold text-rose-600 transition duration-cozy ease-cozy hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-3">
                  <Link
                    to="/auth?mode=login"
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth?mode=signup"
                    className="flex-1 rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition duration-cozy ease-cozy hover:bg-primary/90"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
              <div className="mt-2 rounded-lg border border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Language</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {languages.map((lang) => {
                    const isActive = lang.code === language;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLanguage(lang.code)}
                        className={`rounded-pill border px-3 py-1 text-xs font-semibold transition ${
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 text-slate-600 hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>
        </header>

        <main>
          <section
            id="home"
            className="relative overflow-hidden bg-slate-900 text-white"
          >
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(41, 64, 114, 0.9), rgba(23, 38, 75, 0.8)), url('https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1600&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-4 py-24 sm:px-6 lg:flex-row lg:items-center lg:py-32 lg:px-8">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-sunshine" />
                  Rwanda's collaborative housing future
                </span>
                <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                  Co-invest in modern community housing.
                </h1>
                <p className="mt-6 text-lg font-light text-white/90 sm:text-xl">
                  Together we build a future of affordable and community-driven
                  living. Join Urban Evolution Group, Use TURANEZA App to unlock
                  high-impact housing opportunities across Rwanda.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={handleStartInvesting}
                    className="inline-flex items-center rounded-pill bg-white px-5 py-3 text-sm font-semibold text-primary shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-sunshine hover:text-slate-900"
                  >
                    Register a plot
                  </button>
                  <a
                    href="#about"
                    className="inline-flex items-center rounded-pill border border-white/40 px-5 py-3 text-sm font-semibold text-white transition duration-cozy ease-cozy hover:border-white hover:bg-white/10"
                  >
                    How it works
                  </a>
                </div>
              </div>
              <div className="relative w-full max-w-lg rounded-card bg-white/5 p-5 backdrop-blur sm:p-8">
                <div className="grid gap-6">
                  <div className="rounded-card bg-white/10 p-5 text-sm sm:p-6">
                    <p className="text-sunshine font-semibold uppercase tracking-wider">
                      Our Promise
                    </p>
                    <p className="mt-3 font-serif text-base text-white/90">
                      Transparent co-ownership structures, help people to create
                      and choose groups that fit their goals and make possible
                      to live in modern, affordable apartments near their
                      activities.
                    </p>
                  </div>
                  <div className="rounded-card bg-white/10 p-5 text-sm sm:p-6">
                    <p className="text-mint font-semibold uppercase tracking-wider">
                      Impact Snapshot
                    </p>
                    <ul className="mt-4 space-y-3 text-white/90">
                      <li className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-semibold">
                          1.2k
                        </span>
                        <span>Households reached through co-investment</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-semibold">
                          92%
                        </span>
                        <span>Average occupancy in first 12 months</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-semibold">
                          65%
                        </span>
                        <span>Projects under construction works</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="overflow-hidden rounded-card bg-white shadow-2xl">
                  <div className="h-[22rem] w-full bg-black sm:h-[26rem] lg:h-[30rem]">
                    <iframe
                      className="h-full w-full"
                      src="https://www.youtube.com/embed/V8G9bNKzk_s"
                      title="Urban Evolution Group RWANDA - TURANEZA App: GUHURIRA HAMWE HAKUBAKWA INZU ZIGEZWEHO KU BUTAKA BUTO."
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                  <div className="bg-white px-5 py-4 sm:px-6">
                    <p className="text-base font-semibold text-slate-900">
                      Turaneza App, clearly explained and thoughtfully designed to solve real housing investment challenges.
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      See how the platform brings people together, simplifies collaboration, and turns shared ambition into practical action.
                    </p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-card bg-white shadow-2xl">
                  <div className="h-[22rem] w-full bg-black sm:h-[26rem] lg:h-[30rem]">
                    <iframe
                      className="h-full w-full"
                      src="https://www.youtube.com/embed/nf4IHf9kbTg"
                      title="TURANEZA App Demonstration step by step. EVERYTHING IS CLEAR, YOUR INVESTMENTS ARE SECURE."
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                  <div className="bg-white px-5 py-4 sm:px-6">
                    <p className="text-base font-semibold text-slate-900">
                      Explore the Turaneza App journey with a guided walkthrough of its main features and flow.
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      This video shows how users can navigate the platform with confidence, from discovering opportunities to engaging with the tools that support secure participation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="about"
            className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
          >
            <div className="grid gap-10 lg:grid-cols-[2fr,3fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-pill bg-mint/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-mint">
                  About Urban Evolution Group
                </span>
                <h2 className="mt-5 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  A Rwandan initiative for affordable, sustainable housing.
                </h2>
                <div className="mt-6 space-y-4 text-base text-slate-600">
                  {/* Urban Evolution Group is dedicated to building resilient
                  communities through collaborative housing investment models.
                  We believe that everyone deserves accessible, dignified homes
                  with shared benefits for residents, investors, and the
                  environment. */}
                  <p>
                    Urban Evolution Group through TURANEZA App is building
                    Rwanda’s next generation of affordable housing where dignity,
                    community, and sustainability come first.
                  </p>
                  <p>
                    We organize collaborative investment groups that turn shared
                    contributions into real homes, real ownership, and real
                    progress. With trusted local partners and energy-smart
                    design, we create inclusive communities that benefit
                    residents, investors, and the environment for years to come.
                  </p>
                </div>
                <p className="mt-4 text-base text-slate-600">
                  By combining cooperative financing, local partnerships, and
                  smart design, we deliver space-efficient developments that are
                  socially inclusive and economically rewarding.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {storyHighlights.map((story) => (
                  <Link
                    key={story.slug}
                    to={`/stories/${story.slug}`}
                    className="group rounded-card bg-white p-6 shadow-card transition duration-cozy ease-cozy hover:-translate-y-1"
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                      Insight
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">
                      {story.title}
                    </h3>
                    <p className="mt-4 font-serif text-base text-slate-600">
                      {story.summary}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                      Read full story -&gt;
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section id="housing" className="bg-white py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-pill bg-sunshine/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-sunshine">
                    Housing Opportunities
                  </span>
                  <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
                    Multi-family, multi homes communities ready for
                    co-investment.
                  </h2>
                </div>
                <a
                  href="#invest"
                  className="inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-white shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  Explore All Projects
                </a>
              </div>
              {loadingProjects ? (
                <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((placeholder) => (
                    <div
                      key={placeholder}
                      className="h-96 animate-pulse rounded-card bg-porcelain"
                    />
                  ))}
                </div>
              ) : latestProjects.length ? (
                <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {latestProjects.map((project) => (
                    <article
                      key={project.id}
                      className="group flex flex-col overflow-hidden rounded-card bg-porcelain shadow-card transition duration-cozy ease-cozy hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="relative h-56 w-full overflow-hidden bg-slate-200">
                        {project.featured_image ? (
                          <div
                            className="h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url('${sanitizeUrl(project.featured_image)}')` }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                            Image coming soon
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-slate-900/20 to-transparent transition duration-cozy ease-cozy group-hover:opacity-80" />
                      </div>
                      <div className="flex flex-1 flex-col gap-4 p-6">
                        <span className="inline-flex w-fit items-center gap-2 rounded-pill bg-mint/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-mint">
                          {project.group_name ? `${project.group_name} group` : project.status || "In progress"}
                        </span>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {project.name}
                        </h3>
                        <p className="font-serif text-sm text-slate-600">
                          {project.summary || project.location}
                        </p>
                        <div className="mt-auto grid gap-3 rounded-card bg-white p-4 text-sm text-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-500">
                              Investors
                            </span>
                            <span className="font-medium text-slate-900">
                              {project.active_investors || 0} co-investors
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="font-semibold text-slate-500">
                              Investment
                            </span>
                            <span className="font-medium text-primary">Undisclosed</span>
                          </div>
                        </div>
                        <Link
                          to={project.group ? `/groups/${project.group}` : "/groups"}
                          className="inline-flex items-center justify-center rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary"
                        >
                          View details
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-12 rounded-card bg-porcelain p-10 text-center text-sm text-slate-500">
                  New co-investment projects are being added — check back soon.
                </div>
              )}
            </div>
          </section>

          <section
            id="invest"
            className="relative overflow-hidden bg-slate-900 py-24 text-white sm:py-28"
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary/80 via-slate-900 to-slate-900/90"
              aria-hidden="true"
            />
            <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr,0.9fr] lg:px-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-mint">
                  Invest with Confidence
                </span>
                <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">
                  Express your interest and reserve your spot.
                </h2>
                <p className="mt-4 text-base font-light text-white/80">
                  Complete the form to connect with our investment concierge
                  team. We share detailed project briefs, impact reports, and
                  transparent financials for all available opportunities.
                </p>
                <div className="mt-10 grid gap-5 sm:grid-cols-2">
                  {[
                    {
                      step: "01",
                      title: "Discover",
                      text: "Review curated multi-family projects with full transparency.",
                    },
                    {
                      step: "02",
                      title: "Co-design",
                      text: "Shape amenities and governance alongside future residents.",
                    },
                    {
                      step: "03",
                      title: "Invest",
                      text: "Select a co-investment tier that matches your goals.",
                    },
                    {
                      step: "04",
                      title: "Thrive",
                      text: "Enjoy dividends, appreciation, and community impact.",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center gap-4 rounded-card bg-white/10 p-5"
                    >
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-semibold">
                        {item.step}
                      </span>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-sunshine">
                          {item.title}
                        </p>
                        <p className="text-sm text-white/80">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-card bg-white p-8 text-slate-900 shadow-2xl">
                <h3 className="text-2xl font-semibold text-slate-900">
                  Investment Interest Form
                </h3>
                <p className="mt-3 text-sm text-slate-500">
                  Tell us how you would like to participate. Our team will
                  respond within 48 hours.
                </p>
                <form
                  id="invest-form"
                  onSubmit={handleInvestSubmit}
                  className="mt-8 space-y-5"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="investor-name"
                        className="text-sm font-semibold text-slate-600"
                      >
                        Full Name
                      </label>
                      <input
                        id="investor-name"
                        type="text"
                        value={investmentForm.full_name}
                        onChange={(event) =>
                          setInvestmentForm((prev) => ({
                            ...prev,
                            full_name: event.target.value,
                          }))
                        }
                        placeholder="Your full name"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-porcelain px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30"
                        required
                      />
                      {investmentErrors.full_name ? (
                        <p className="mt-2 text-xs text-rose-600">
                          {investmentErrors.full_name}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label
                        htmlFor="investor-email"
                        className="text-sm font-semibold text-slate-600"
                      >
                        Email Address
                      </label>
                      <input
                        id="investor-email"
                        type="email"
                        value={investmentForm.email}
                        onChange={(event) =>
                          setInvestmentForm((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                        placeholder="name@example.com"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-porcelain px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30"
                        required
                      />
                      {investmentErrors.email ? (
                        <p className="mt-2 text-xs text-rose-600">
                          {investmentErrors.email}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="investor-phone"
                        className="text-sm font-semibold text-slate-600"
                      >
                        Phone Number
                      </label>
                      <input
                        id="investor-phone"
                        type="tel"
                        value={investmentForm.phone_number}
                        onChange={(event) =>
                          setInvestmentForm((prev) => ({
                            ...prev,
                            phone_number: event.target.value,
                          }))
                        }
                        placeholder="+250 700 000 000"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-porcelain px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30"
                        required
                      />
                      {investmentErrors.phone_number ? (
                        <p className="mt-2 text-xs text-rose-600">
                          {investmentErrors.phone_number}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label
                        htmlFor="investment-amount"
                        className="text-sm font-semibold text-slate-600"
                      >
                    Desired Investment ($)
                      </label>
                      <input
                        id="investment-amount"
                        type="number"
                        min="1000"
                        step="500"
                        value={investmentForm.desired_investment}
                        onChange={(event) =>
                          setInvestmentForm((prev) => ({
                            ...prev,
                            desired_investment: event.target.value,
                          }))
                        }
                        placeholder="5000"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-porcelain px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30"
                        required
                      />
                      {investmentErrors.desired_investment ? (
                        <p className="mt-2 text-xs text-rose-600">
                          {investmentErrors.desired_investment}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="investment-type"
                      className="text-sm font-semibold text-slate-600"
                    >
                      Housing Interest
                    </label>
                    <select
                      id="investment-type"
                      value={investmentForm.housing_interest}
                      onChange={(event) =>
                        setInvestmentForm((prev) => ({
                          ...prev,
                          housing_interest: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-porcelain px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="affordable">Affordable apartments</option>
                      <option value="mixed-use">Mixed-use communities</option>
                      <option value="senior">Senior-friendly housing</option>
                      <option value="green">Net-zero developments</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="investment-notes"
                      className="text-sm font-semibold text-slate-600"
                    >
                      Notes
                    </label>
                    <textarea
                      id="investment-notes"
                      rows="3"
                      value={investmentForm.notes}
                      onChange={(event) =>
                        setInvestmentForm((prev) => ({
                          ...prev,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Share your goals, partners, or questions..."
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-porcelain px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  {investmentStatus.error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {investmentStatus.error}
                    </div>
                  ) : null}
                  {investmentStatus.success ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {investmentStatus.success}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={investmentStatus.loading}
                    className="w-full rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-white shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-primary/90"
                  >
                    {investmentStatus.loading
                      ? "Submitting..."
                      : "Submit Your Interest"}
                  </button>
                  <p className="text-xs text-slate-400">
                    By submitting, you agree to receive project briefs,
                    investment updates, and community invitations from Urban
                    Evolution Group.
                  </p>
                </form>
              </div>
            </div>
          </section>

          <section
            id="testimonials"
            className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-pill bg-mint/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-mint">
                  Testimonials
                </span>
                <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  Trusted by investors, residents, and partners.
                </h2>
              </div>
              <p className="max-w-xl text-sm text-slate-600">
                Hear how community-driven housing has transformed investments
                into shared prosperity. Slide to explore more voices from Kigali
                to Huye.
              </p>
            </div>
            {loadingTestimonials ? (
              <div className="mt-12 flex gap-6 overflow-x-auto pb-4">
                {[0, 1, 2].map((placeholder) => (
                  <div
                    key={placeholder}
                    className="h-56 w-80 min-w-[20rem] flex-shrink-0 animate-pulse rounded-card bg-porcelain sm:w-96"
                  />
                ))}
              </div>
            ) : testimonials.length ? (
              <div className="mt-12 overflow-x-auto pb-4">
                <div className="flex gap-6">
                  {testimonials.map((testimonial) => (
                    <blockquote
                      key={testimonial.id}
                      className="group relative flex w-80 min-w-[20rem] flex-col gap-6 rounded-card bg-white p-8 shadow-card transition duration-cozy ease-cozy hover:-translate-y-1 hover:shadow-2xl sm:w-96"
                    >
                      <div className="flex items-center gap-4">
                        {testimonial.image ? (
                          <img
                            src={resolveTestimonialImageUrl(testimonial.image)}
                            alt={testimonial.name}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                            className="h-14 w-14 rounded-full object-cover shadow-md"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary shadow-md">
                            {(testimonial.name || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">
                            {testimonial.name}
                          </p>
                          <p className="text-xs font-medium uppercase tracking-widest text-primary">
                            {testimonial.title}
                          </p>
                        </div>
                      </div>
                      <p className="font-serif text-sm text-slate-600">
                        "{testimonial.description}"
                      </p>
                      <span className="absolute right-6 top-6 text-4xl text-sunshine/60 transition duration-cozy ease-cozy group-hover:text-sunshine">
                        "
                      </span>
                    </blockquote>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-12 rounded-card bg-porcelain p-10 text-center text-sm text-slate-500">
                Investor stories are on their way — check back soon.
              </div>
            )}
          </section>

          <section id="contact" className="bg-white py-20 sm:py-24">
            <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr,1fr] lg:px-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-pill bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
                  Get in Touch
                </span>
                <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  We are here to support your housing journey.
                </h2>
                <p className="mt-4 text-base text-slate-600">
                  Whether you are an aspiring homeowner, diaspora investor, or
                  wishing to become our partner, we would love to learn about
                  your goals and explore collaboration opportunities.
                </p>
                <div className="mt-8 grid gap-6 text-sm text-slate-600">
                  <div className="rounded-card bg-porcelain p-5">
                    <p className="font-semibold text-slate-700">Office</p>
                    <p className="mt-2 font-serif">
                    Norrsken Building, Kigali, Rwanda
                    </p>
                  </div>
                  <div className="rounded-card bg-porcelain p-5">
                    <p className="font-semibold text-slate-700">Support</p>
                    <p className="mt-2 font-serif">
                      +250794199534 | info@turaneza.rw
                    </p>
                  </div>
                  <div className="rounded-card bg-porcelain p-5">
                    <p className="font-semibold text-slate-700">Hours</p>
                    <p className="mt-2 font-serif">
                      Monday - Friday | 8:00 AM to 5:00 PM CAT
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-card bg-porcelain p-8 shadow-card">
                <h3 className="text-2xl font-semibold text-slate-900">
                  Contact Form
                </h3>
                <p className="mt-3 text-sm text-slate-600">
                  We respond to inquiries within one business day.
                </p>
                <form onSubmit={handleContactSubmit} className="mt-8 space-y-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="text-sm font-semibold text-slate-600"
                    >
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={contactForm.name}
                      onChange={(event) =>
                        setContactForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Your name"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30"
                      required
                    />
                    {contactErrors.name ? (
                      <p className="mt-2 text-xs text-rose-600">
                        {contactErrors.name}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="text-sm font-semibold text-slate-600"
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={contactForm.email}
                      onChange={(event) =>
                        setContactForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30"
                      required
                    />
                    {contactErrors.email ? (
                      <p className="mt-2 text-xs text-rose-600">
                        {contactErrors.email}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label
                      htmlFor="contact-topic"
                      className="text-sm font-semibold text-slate-600"
                    >
                      Topic
                    </label>
                    <select
                      id="contact-topic"
                      value={contactForm.topic}
                      onChange={(event) =>
                        setContactForm((prev) => ({
                          ...prev,
                          topic: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="investor">Investor support</option>
                      <option value="resident">Resident services</option>
                      <option value="partnership">Partnerships</option>
                      <option value="media">Media inquiry</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="text-sm font-semibold text-slate-600"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows="4"
                      value={contactForm.message}
                      onChange={(event) =>
                        setContactForm((prev) => ({
                          ...prev,
                          message: event.target.value,
                        }))
                      }
                      placeholder="How can we help?"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30"
                      required
                    />
                    {contactErrors.message ? (
                      <p className="mt-2 text-xs text-rose-600">
                        {contactErrors.message}
                      </p>
                    ) : null}
                  </div>
                  {contactStatus.error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {contactStatus.error}
                    </div>
                  ) : null}
                  {contactStatus.success ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {contactStatus.success}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={contactStatus.loading}
                    className="w-full rounded-pill bg-mint px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-mint/90"
                  >
                    {contactStatus.loading ? "Sending..." : "Send Message"}
                  </button>
                  <p className="text-xs text-slate-500">
                    We respect your privacy. View our full policy below.
                  </p>
                </form>
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-slate-900 text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-2 sm:px-6 md:grid-cols-[1.2fr,0.8fr,1fr] lg:px-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-card">
                  <span className="text-xl font-semibold">UEG</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    Urban Evolution Group
                  </p>
                  <p className="text-sm text-white/70">Turaneza App</p>
                </div>
              </div>
              <p className="mt-6 max-w-md text-sm text-white/70">
                Building Rwanda&apos;s next generation of affordable,
                community-first housing through transparent co-investment and
                thoughtful design.
              </p>
              <div className="mt-6 flex gap-4 text-sm text-white/60">
                <a
                  href="#privacy"
                  className="transition duration-cozy ease-cozy hover:text-white"
                >
                  Privacy Policy
                </a>
                <a
                  href="#terms"
                  className="transition duration-cozy ease-cozy hover:text-white"
                >
                  Terms of Service
                </a>
                <a
                  href="#legal"
                  className="transition duration-cozy ease-cozy hover:text-white"
                >
                  Legal Disclaimers
                </a>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-sunshine">
                Explore
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {navigationLinks.map((item) => {
                  const isRoute = item.href.startsWith("/");
                  return (
                    <li key={`footer-${item.name}`}>
                      {isRoute ? (
                        <Link
                          to={item.href}
                          className="transition duration-cozy ease-cozy hover:text-white"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          className="transition duration-cozy ease-cozy hover:text-white"
                        >
                          {item.name}
                        </a>
                      )}
                    </li>
                  );
                })}
                <li>
                  <a
                    href="#invest"
                    className="transition duration-cozy ease-cozy hover:text-white"
                  >
                    Invest
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-sunshine">
                Stay Updated
              </p>
              <p className="mt-4 text-sm text-white/70">
                Receive quarterly impact reports and early access to new
                developments.
              </p>
              <form className="mt-6 flex gap-3">
                <input
                  type="email"
                  placeholder="Email address"
                  className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 outline-none transition duration-cozy ease-cozy focus:border-sunshine focus:bg-white/20"
                  required
                />
                <button
                  type="submit"
                  className="rounded-pill bg-sunshine px-4 py-3 text-sm font-semibold text-slate-900 transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-sunshine/90"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/60 sm:px-6 lg:px-8">
            (c) {new Date().getFullYear()} Urban Evolution Group. All Rights
            Reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
