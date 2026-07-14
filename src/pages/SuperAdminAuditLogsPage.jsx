import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SuperAdminShell from '../components/SuperAdminShell';
import {
  fetchSuperAdminAuditLogs,
  fetchSuperAdminContactSubmissions,
  fetchSuperAdminInvestmentInterestSubmissions,
  fetchSuperAdminMe,
} from '../api/superadmin';

const TABS = {
  audit: 'audit',
  investments: 'investments',
  contacts: 'contacts',
};

const formatDateTime = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return value;
  }
};

const SeverityBadge = ({ value }) => {
  const tone =
    value === 'CRITICAL'
      ? 'bg-rose-100 text-rose-600'
      : value === 'WARN'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';
  return <span className={`rounded-pill px-3 py-1 text-[10px] font-semibold ${tone}`}>{value || 'INFO'}</span>;
};

const tabButtonClass = (isActive) =>
  `rounded-pill px-4 py-2 text-xs font-semibold transition ${
    isActive ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary'
  }`;

const filterToQuery = (filters, page, pageSize) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  return `?${params.toString()}`;
};

const DetailsModal = ({ title, selected, onClose }) => {
  if (!selected) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
          >
            Close
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          {Object.entries(selected).map(([key, value]) => (
            <div key={key}>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{key.replace(/_/g, ' ')}</p>
              <div className="mt-1 rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                {typeof value === 'object' && value !== null ? (
                  <pre className="overflow-auto text-xs">{JSON.stringify(value, null, 2)}</pre>
                ) : (
                  String(value || '-')
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Back to list
          </button>
        </div>
      </div>
    </div>
  );
};

const SuperAdminAuditLogsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(Object.values(TABS).includes(initialTab) ? initialTab : TABS.audit);
  const [selected, setSelected] = useState(null);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [auditState, setAuditState] = useState({
    rows: [],
    count: 0,
    totalPages: 1,
    page: 1,
    meta: { action_types: [], severities: ['INFO', 'WARN', 'CRITICAL'] },
    filters: {
      start: '',
      end: '',
      severity: '',
      action_type: '',
      actor_username: '',
      target_type: '',
      target_id: '',
      search: '',
    },
  });

  const [investmentState, setInvestmentState] = useState({
    rows: [],
    count: 0,
    totalPages: 1,
    page: 1,
    meta: { housing_interests: [] },
    filters: {
      start: '',
      end: '',
      housing_interest: '',
      search: '',
    },
  });

  const [contactState, setContactState] = useState({
    rows: [],
    count: 0,
    totalPages: 1,
    page: 1,
    meta: { topics: [] },
    filters: {
      start: '',
      end: '',
      topic: '',
      search: '',
    },
  });

  const auditQuery = useMemo(
    () => filterToQuery(auditState.filters, auditState.page, pageSize),
    [auditState.filters, auditState.page, pageSize],
  );
  const investmentQuery = useMemo(
    () => filterToQuery(investmentState.filters, investmentState.page, pageSize),
    [investmentState.filters, investmentState.page, pageSize],
  );
  const contactQuery = useMemo(
    () => filterToQuery(contactState.filters, contactState.page, pageSize),
    [contactState.filters, contactState.page, pageSize],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchSuperAdminMe();
      const [auditData, investmentData, contactData] = await Promise.all([
        fetchSuperAdminAuditLogs(auditQuery),
        fetchSuperAdminInvestmentInterestSubmissions(investmentQuery),
        fetchSuperAdminContactSubmissions(contactQuery),
      ]);
      setAuditState((prev) => ({
        ...prev,
        rows: auditData.results || [],
        count: auditData.count || 0,
        totalPages: auditData.total_pages || 1,
        meta: {
          action_types: auditData.action_types || [],
          severities: auditData.severities || ['INFO', 'WARN', 'CRITICAL'],
        },
      }));
      setInvestmentState((prev) => ({
        ...prev,
        rows: investmentData.results || [],
        count: investmentData.count || 0,
        totalPages: investmentData.total_pages || 1,
        meta: {
          housing_interests: investmentData.housing_interests || [],
        },
      }));
      setContactState((prev) => ({
        ...prev,
        rows: contactData.results || [],
        count: contactData.count || 0,
        totalPages: contactData.total_pages || 1,
        meta: {
          topics: contactData.topics || [],
        },
      }));
    } catch (err) {
      setError(err.message || 'Unable to load super admin records.');
      if (err?.status === 401 || err?.status === 403) {
        navigate('/super-admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, auditQuery, investmentQuery, contactQuery]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelected(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected]);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (Object.values(TABS).includes(requestedTab) && requestedTab !== activeTab) {
      setActiveTab(requestedTab);
    }
  }, [activeTab, searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const activeCount =
    activeTab === TABS.audit ? auditState.count : activeTab === TABS.investments ? investmentState.count : contactState.count;
  const activePage = activeTab === TABS.audit ? auditState.page : activeTab === TABS.investments ? investmentState.page : contactState.page;
  const activeTotalPages =
    activeTab === TABS.audit ? auditState.totalPages : activeTab === TABS.investments ? investmentState.totalPages : contactState.totalPages;

  const resetAuditFilters = () =>
    setAuditState((prev) => ({
      ...prev,
      page: 1,
      filters: {
        start: '',
        end: '',
        severity: '',
        action_type: '',
        actor_username: '',
        target_type: '',
        target_id: '',
        search: '',
      },
    }));

  const resetInvestmentFilters = () =>
    setInvestmentState((prev) => ({
      ...prev,
      page: 1,
      filters: {
        start: '',
        end: '',
        housing_interest: '',
        search: '',
      },
    }));

  const resetContactFilters = () =>
    setContactState((prev) => ({
      ...prev,
      page: 1,
      filters: {
        start: '',
        end: '',
        topic: '',
        search: '',
      },
    }));

  return (
    <SuperAdminShell title="Audit Logs" subtitle="Super Admin">
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Audit and landing submissions</h2>
            <p className="text-sm text-slate-500">
              Review system activity, investor interest requests, and public contact messages.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500">Total records: {activeCount}</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => handleTabChange(TABS.audit)} className={tabButtonClass(activeTab === TABS.audit)}>
            Audit timeline
          </button>
          <button
            type="button"
            onClick={() => handleTabChange(TABS.investments)}
            className={tabButtonClass(activeTab === TABS.investments)}
          >
            Investment interest
          </button>
          <button
            type="button"
            onClick={() => handleTabChange(TABS.contacts)}
            className={tabButtonClass(activeTab === TABS.contacts)}
          >
            Contact forms
          </button>
        </div>

        {activeTab === TABS.audit ? (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                type="date"
                value={auditState.filters.start}
                onChange={(e) =>
                  setAuditState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, start: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
              />
              <input
                type="date"
                value={auditState.filters.end}
                onChange={(e) =>
                  setAuditState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, end: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
              />
              <select
                value={auditState.filters.severity}
                onChange={(e) =>
                  setAuditState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, severity: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
              >
                <option value="">All severities</option>
                {auditState.meta.severities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={auditState.filters.action_type}
                onChange={(e) =>
                  setAuditState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, action_type: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
              >
                <option value="">All actions</option>
                {auditState.meta.action_types.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                value={auditState.filters.actor_username}
                onChange={(e) =>
                  setAuditState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, actor_username: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
                placeholder="Actor username"
              />
              <input
                value={auditState.filters.target_type}
                onChange={(e) =>
                  setAuditState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, target_type: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
                placeholder="Target type"
              />
              <input
                value={auditState.filters.target_id}
                onChange={(e) =>
                  setAuditState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, target_id: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
                placeholder="Target ID"
              />
              <input
                value={auditState.filters.search}
                onChange={(e) =>
                  setAuditState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, search: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
                placeholder="Search all fields"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetAuditFilters}
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
              >
                Reset filters
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Page size</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-pill border border-slate-200 px-3 py-1 text-xs"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : null}

        {activeTab === TABS.investments ? (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                type="date"
                value={investmentState.filters.start}
                onChange={(e) =>
                  setInvestmentState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, start: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
              />
              <input
                type="date"
                value={investmentState.filters.end}
                onChange={(e) =>
                  setInvestmentState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, end: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
              />
              <select
                value={investmentState.filters.housing_interest}
                onChange={(e) =>
                  setInvestmentState((prev) => ({
                    ...prev,
                    page: 1,
                    filters: { ...prev.filters, housing_interest: e.target.value },
                  }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
              >
                <option value="">All housing interests</option>
                {investmentState.meta.housing_interests.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                value={investmentState.filters.search}
                onChange={(e) =>
                  setInvestmentState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, search: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
                placeholder="Search name, email, phone, notes"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetInvestmentFilters}
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
              >
                Reset filters
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Page size</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-pill border border-slate-200 px-3 py-1 text-xs"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : null}

        {activeTab === TABS.contacts ? (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                type="date"
                value={contactState.filters.start}
                onChange={(e) =>
                  setContactState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, start: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
              />
              <input
                type="date"
                value={contactState.filters.end}
                onChange={(e) =>
                  setContactState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, end: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
              />
              <select
                value={contactState.filters.topic}
                onChange={(e) =>
                  setContactState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, topic: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
              >
                <option value="">All topics</option>
                {contactState.meta.topics.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                value={contactState.filters.search}
                onChange={(e) =>
                  setContactState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, search: e.target.value } }))
                }
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs"
                placeholder="Search name, email, message"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetContactFilters}
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
              >
                Reset filters
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Page size</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-pill border border-slate-200 px-3 py-1 text-xs"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? <div className="py-6 text-sm text-slate-600">Loading records...</div> : null}

        {!loading && activeTab === TABS.audit ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2 py-3">Time</th>
                    <th className="px-2 py-3">Actor</th>
                    <th className="px-2 py-3">Action</th>
                    <th className="px-2 py-3">Target</th>
                    <th className="px-2 py-3">Reason</th>
                    <th className="px-2 py-3">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {auditState.rows.length ? (
                    auditState.rows.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelected(log)}
                        className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-2 py-3 text-xs text-slate-500">{formatDateTime(log.created_at)}</td>
                        <td className="px-2 py-3 text-sm text-slate-800">{log.actor_name || log.actor_email || 'System'}</td>
                        <td className="px-2 py-3 font-semibold text-slate-900">{log.action_type}</td>
                        <td className="px-2 py-3 text-xs text-slate-500">
                          {log.target_type ? `${log.target_type} #${log.target_id || '-'}` : 'SYSTEM'}
                        </td>
                        <td className="px-2 py-3 text-xs text-slate-500">{log.reason || '-'}</td>
                        <td className="px-2 py-3">
                          <SeverityBadge value={log.severity || 'INFO'} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-2 py-4 text-sm text-slate-500" colSpan={6}>
                        No audit logs match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {!loading && activeTab === TABS.investments ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-3">Time</th>
                  <th className="px-2 py-3">Name</th>
                  <th className="px-2 py-3">Email</th>
                  <th className="px-2 py-3">Phone</th>
                  <th className="px-2 py-3">Investment</th>
                  <th className="px-2 py-3">Housing interest</th>
                </tr>
              </thead>
              <tbody>
                {investmentState.rows.length ? (
                  investmentState.rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-2 py-3 text-xs text-slate-500">{formatDateTime(row.created_at)}</td>
                      <td className="px-2 py-3 font-semibold text-slate-900">{row.full_name}</td>
                      <td className="px-2 py-3 text-xs text-slate-500">{row.email}</td>
                      <td className="px-2 py-3 text-xs text-slate-500">{row.phone_number}</td>
                      <td className="px-2 py-3 text-xs text-slate-500">${row.desired_investment}</td>
                      <td className="px-2 py-3 text-xs text-slate-500">{row.housing_interest_label}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-2 py-4 text-sm text-slate-500" colSpan={6}>
                      No investment interest submissions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && activeTab === TABS.contacts ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-3">Time</th>
                  <th className="px-2 py-3">Name</th>
                  <th className="px-2 py-3">Email</th>
                  <th className="px-2 py-3">Topic</th>
                  <th className="px-2 py-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {contactState.rows.length ? (
                  contactState.rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-2 py-3 text-xs text-slate-500">{formatDateTime(row.created_at)}</td>
                      <td className="px-2 py-3 font-semibold text-slate-900">{row.name}</td>
                      <td className="px-2 py-3 text-xs text-slate-500">{row.email}</td>
                      <td className="px-2 py-3 text-xs text-slate-500">{row.topic_label}</td>
                      <td className="px-2 py-3 text-xs text-slate-500">{row.message.slice(0, 80)}{row.message.length > 80 ? '...' : ''}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-2 py-4 text-sm text-slate-500" colSpan={5}>
                      No contact submissions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => {
                if (activeTab === TABS.audit) {
                  setAuditState((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
                } else if (activeTab === TABS.investments) {
                  setInvestmentState((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
                } else {
                  setContactState((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
                }
              }}
              disabled={activePage <= 1}
              className="rounded-pill border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
            >
              Prev
            </button>
            <span>
              Page {activePage} of {activeTotalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                if (activeTab === TABS.audit) {
                  setAuditState((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }));
                } else if (activeTab === TABS.investments) {
                  setInvestmentState((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }));
                } else {
                  setContactState((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }));
                }
              }}
              disabled={activePage >= activeTotalPages}
              className="rounded-pill border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      <DetailsModal
        title={
          activeTab === TABS.audit
            ? `Audit Log #${selected?.id || ''}`
            : activeTab === TABS.investments
            ? `Investment Interest #${selected?.id || ''}`
            : `Contact Submission #${selected?.id || ''}`
        }
        selected={selected}
        onClose={() => setSelected(null)}
      />
    </SuperAdminShell>
  );
};

export default SuperAdminAuditLogsPage;
