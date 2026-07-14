import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { fetchCurrentUser, logoutUser } from '../api/users';
import { fetchComplianceRequirements } from '../api/compliance';
import { usePreferences } from '../context/PreferencesContext';

export const InvestorContext = createContext({
  user: null,
  loadingUser: true,
  userError: null,
  logout: () => {},
});

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', translationKey: 'nav.dashboard' },
  { key: 'groups', label: 'Groups', to: '/groups', translationKey: 'nav.groups' },
  { key: 'plots', label: 'Plots', to: '/plots', translationKey: 'nav.plots' },
  { key: 'properties', label: 'Properties', to: '/properties', translationKey: 'nav.properties' },
  { key: 'investments', label: 'Investments', to: '/investments', translationKey: 'nav.investments' },
  { key: 'legal', label: 'Legal', to: '/legal', translationKey: 'nav.legal' },
  { key: 'account', label: 'Account', to: '/account', translationKey: 'nav.account' },
  { key: 'help', label: 'Help', to: '/help', translationKey: 'nav.help' },
];

const baseNavClass =
  'rounded-pill px-3 py-1 text-sm font-bold transition duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

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

const InvestorLayout = ({ active = 'dashboard', children, headerActions = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState(null);
  const [complianceMissing, setComplianceMissing] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const menuRef = useRef(null);
  const langMenuRef = useRef(null);
  const { translate: t, language, languages, setLanguage, theme, toggleTheme, autoTranslate, setAutoTranslate } =
    usePreferences();

  useEffect(() => {
    let mounted = true;
    const fallback = setTimeout(() => {
      if (!mounted) return;
      setLoadingUser(false);
      setUser(null);
      setUserError((prev) => prev || 'Unable to load profile. Continuing in limited mode.');
    }, 10000);
    const loadUser = async () => {
      setLoadingUser(true);
      setUserError(null);
      try {
        const response = await fetchCurrentUser();
        if (mounted) {
          setUser(response);
        }
      } catch (error) {
        if (mounted) {
          if (error.status === 401 || error.status === 403) {
            navigate('/auth', { replace: true, state: { from: location.pathname } });
            return;
          }
          setUserError(error.message || 'Unable to load profile');
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoadingUser(false);
          clearTimeout(fallback);
        }
      }
    };

    loadUser();
    return () => {
      mounted = false;
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const checkCompliance = async () => {
      if (!user || loadingUser) return;
      try {
        const reqs = await fetchComplianceRequirements();
        const list = Array.isArray(reqs) ? reqs : reqs?.results || [];
        const missingRequired = list.some(
          (req) => req.is_required && req.status && req.status !== 'approved'
        );
        if (alive) {
          setComplianceMissing(missingRequired);
        }
      } catch (err) {
        if (alive) {
          setComplianceMissing(false);
        }
      }
    };
    checkCompliance();
    return () => {
      alive = false;
    };
  }, [user, loadingUser]);

  // Keep navigation accessible; only show banner when compliance is missing.

  useEffect(() => {
    setMobileNavOpen(false);
    setMenuOpen(false);
  }, [active]);

  const initials = (user?.full_name || user?.email || 'UEG')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    setLogoutError(null);
    setLoggingOut(true);
    try {
      await logoutUser();
      setUser(null);
      navigate('/auth', { replace: true });
    } catch (error) {
      setLogoutError(error.message || 'Unable to log out right now.');
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
      setMobileNavOpen(false);
    }
  }, [navigate]);

  const userRoleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : t('menu.greeting', 'Aspiring investor');

  const contextValue = useMemo(
    () => ({
      user,
      loadingUser,
      userError,
      logout: handleLogout,
      refreshUser: async () => {
        setLoadingUser(true);
        setUserError(null);
        try {
          const response = await fetchCurrentUser();
          setUser(response);
        } catch (err) {
          if (err.status === 401 || err.status === 403) {
            navigate('/auth', { replace: true, state: { from: location.pathname } });
            return;
          }
          setUserError(err.message || 'Unable to load profile');
        } finally {
          setLoadingUser(false);
        }
      },
    }),
    [handleLogout, user, loadingUser, userError, navigate, location.pathname],
  );

  return (
    <InvestorContext.Provider value={contextValue}>
      <div className="min-h-screen bg-porcelain text-slate-900">
        <header className="relative z-30 border-b border-white/40 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between overflow-visible px-4 py-5 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/urban_evolution_group_logo.png"
                alt="Urban Evolution Group"
                className="h-11 w-11 rounded-2xl object-contain shadow-card"
              />
              <div>
                <p className="text-base font-semibold text-slate-900">Urban Evolution Group</p>
                <p className="text-xs text-slate-500">Turaneza App</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-3 lg:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.key;
                const label = t(item.translationKey, item.label);
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    className={clsx(
                      baseNavClass,
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-slate-600 hover:bg-primary/10 hover:text-primary'
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {headerActions}
              <div className="relative hidden lg:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-card transition hover:border hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {loadingUser ? (
                      <span className="h-4 w-4 animate-pulse rounded-full bg-primary/60" />
                    ) : (
                      initials || 'U'
                    )}
                  </div>
                  <div className="min-w-[160px] text-left">
                    {loadingUser ? (
                      <div className="space-y-1">
                        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                        <div className="h-2 w-16 animate-pulse rounded-full bg-slate-200" />
                      </div>
                    ) : userError ? (
                      <p className="text-xs text-rose-500">{userError}</p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-900">{user?.full_name || user?.email}</p>
                        <p className="text-xs text-slate-500">{userRoleLabel}</p>
                      </>
                    )}
                  </div>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-slate-100 bg-white shadow-xl">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {initials || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {user?.full_name || user?.email || 'Guest'}
                        </p>
                        <p className="truncate text-xs text-slate-500">{userRoleLabel}</p>
                      </div>
                    </div>

                    <div className="space-y-4 px-4 py-3 text-sm text-slate-700">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          {t('menu.theme.label', 'Theme')}
                        </p>
                        <button
                          type="button"
                          onClick={toggleTheme}
                          className="mt-2 flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 transition hover:border-primary/60 hover:text-primary"
                        >
                          <span>
                            {theme === 'dark'
                              ? t('menu.theme.light', 'Day mode')
                              : t('menu.theme.dark', 'Dark mode')}
                          </span>
                          <span
                            className={clsx(
                              'flex h-6 w-11 items-center rounded-full bg-slate-200 transition',
                              theme === 'dark' ? 'justify-end bg-slate-800' : 'justify-start',
                            )}
                          >
                            <span className="m-1 h-4 w-4 rounded-full bg-white shadow" />
                          </span>
                        </button>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          {t('menu.language.label', 'Language')}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {languages.map((lang) => {
                            const isActive = lang.code === language;
                            return (
                              <button
                                key={lang.code}
                                type="button"
                                onClick={() => setLanguage(lang.code)}
                                className={clsx(
                                  'rounded-pill border px-3 py-1 text-xs font-semibold transition',
                                  isActive
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-slate-200 text-slate-600 hover:border-primary/50 hover:text-primary',
                                )}
                              >
                                {lang.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Link
                          to="/account"
                          className="block rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary/60 hover:text-primary"
                          onClick={() => setMenuOpen(false)}
                        >
                          {t('menu.viewProfile', 'View account')}
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                          {loggingOut ? 'Logging out...' : t('menu.logout', 'Log out')}
                          </button>
                          {logoutError ? <p className="text-[11px] text-rose-600">{logoutError}</p> : null}
                        </div>

                      <div className="border-t border-slate-100 pt-3">
                        <label className="flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span>Auto-translate content</span>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={autoTranslate}
                            onChange={(e) => setAutoTranslate(e.target.checked)}
                          />
                        </label>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Disable if translations slow down navigation.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="relative hidden lg:block" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setLangMenuOpen((prev) => !prev)}
                  aria-label={t('menu.language.label', 'Language')}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-primary/60 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <GlobeIcon className="h-5 w-5" />
                </button>
                {langMenuOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                    <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      {t('menu.language.label', 'Language')}
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
                          className={clsx(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition',
                            isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-primary/10 hover:text-primary',
                          )}
                        >
                          {lang.label}
                          {isActive ? <CheckIcon className="h-4 w-4" /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="inline-flex items-center rounded-pill border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary/60 hover:text-primary lg:hidden"
                onClick={() => setMobileNavOpen((prev) => !prev)}
              >
                Menu
              </button>
            </div>
          </div>
          <div
            className={clsx(
              'border-t border-slate-100 bg-white lg:hidden',
              mobileNavOpen ? 'block' : 'hidden'
            )}
          >
            <nav className="mx-auto grid max-w-7xl gap-2 px-4 py-4 pb-24 sm:px-6">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.key;
                const label = t(item.translationKey, item.label);
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    onClick={() => setMobileNavOpen(false)}
                    className={clsx(
                      'rounded-lg px-4 py-3 text-sm font-semibold transition duration-150 ease-in-out',
                      isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-primary/10 hover:text-primary'
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
              <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {loadingUser ? (
                    <span className="h-4 w-4 animate-pulse rounded-full bg-primary/60" />
                  ) : (
                    initials || 'U'
                  )}
                </div>
                <div className="flex-1">
                  {loadingUser ? (
                    <div className="space-y-1">
                      <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-2 w-16 animate-pulse rounded-full bg-slate-200" />
                    </div>
                  ) : userError ? (
                    <p className="text-xs text-rose-500">{userError}</p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-900">{user?.full_name || user?.email}</p>
                      <p className="text-xs text-slate-500">{userRoleLabel}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-3 rounded-xl bg-white px-4 py-3 pr-16 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {t('menu.theme.label', 'Theme')}
                  </p>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center gap-2 rounded-pill border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary/60 hover:text-primary"
                  >
                    {theme === 'dark' ? t('menu.theme.light', 'Day mode') : t('menu.theme.dark', 'Dark mode')}
                  </button>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {t('menu.language.label', 'Language')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {languages.map((lang) => {
                      const isActive = lang.code === language;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setLanguage(lang.code)}
                          className={clsx(
                            'rounded-pill border px-3 py-1 text-xs font-semibold transition',
                            isActive
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-slate-200 text-slate-600 hover:border-primary/50 hover:text-primary',
                          )}
                        >
                          {lang.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    to="/account"
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary/60 hover:text-primary"
                  >
                    {t('menu.viewProfile', 'View account')}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                  >
                    {loggingOut ? 'Logging out...' : t('menu.logout', 'Log out')}
                  </button>
                  {logoutError ? <p className="text-[11px] text-rose-600">{logoutError}</p> : null}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Auto-translate content</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={autoTranslate}
                      onChange={(e) => setAutoTranslate(e.target.checked)}
                    />
                  </label>
                  <p className="mt-1 text-[11px] text-slate-400">Disable if translations slow navigation.</p>
                </div>
              </div>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          {complianceMissing ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Compliance required: please upload and get approval for required verification documents to continue.
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </InvestorContext.Provider>
  );
};

export default InvestorLayout;
