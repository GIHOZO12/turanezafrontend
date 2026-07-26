import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import InvestorLayout from '../components/InvestorLayout';
import { fetchPropertyListings } from '../api/projects';
import { formatCurrency } from '../utils/currency';
import { sanitizeUrl } from '../utils/url';

// Human-friendly labels for property categories used in listings + filters.
const PROPERTY_TYPE_LABELS = {
  apartment: 'Apartments & Condos',
  co_living: 'Co-living',
  mixed_use: 'Mixed-use',
  townhouse: 'Townhouses',
  villa: 'Villas',
  commercial: 'Commercial',
};

// Availability badge palette for each property card.
const STATUS_BADGES = {
  occupied: { label: 'Fully occupied', tone: 'bg-emerald-50 text-emerald-700' },
  for_rent: { label: 'For rent', tone: 'bg-sky-50 text-sky-700' },
  for_sale: { label: 'For sale', tone: 'bg-violet-50 text-violet-700' },
  mixed: { label: 'Rent & sale', tone: 'bg-amber-50 text-amber-700' },
};

// Construction/lifecycle stage badge, independent of listing (rent/sale) status.
const PROJECT_STATUS_BADGES = {
  funding: { label: 'Funding', tone: 'bg-amber-50 text-amber-700' },
  active: { label: 'Under construction', tone: 'bg-sky-50 text-sky-700' },
  completed: { label: 'Completed', tone: 'bg-emerald-50 text-emerald-700' },
};

// Dropdown values controlling the "type" filter row.
const PROPERTY_TYPE_FILTERS = [
  { value: 'all', label: 'All types' },
  { value: 'apartment', label: 'Apartments & condos' },
  { value: 'townhouse', label: 'Townhouses' },
  { value: 'villa', label: 'Villas' },
  { value: 'mixed_use', label: 'Mixed-use' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'co_living', label: 'Co-living hubs' },
];

// Filter options mirroring backend `listing_status` values.
const STATUS_FILTERS = [
  { value: 'all', label: 'All availability' },
  { value: 'occupied', label: 'Fully occupied' },
  { value: 'for_rent', label: 'Available for rent' },
  { value: 'for_sale', label: 'Available for sale' },
  { value: 'mixed', label: 'Rent & sale' },
];

// Price buckets that we convert into min/max query params.
const PRICE_FILTERS = [
  { value: 'all', label: 'All prices' },
  { value: '0-1000000', label: 'Under $1M' },
  { value: '1000000-3000000', label: '$1M – $3M' },
  { value: '3000000-5000000', label: '$3M – $5M' },
  { value: '5000000+', label: '$5M+' },
];

// Baseline filter/search state for the page.
const defaultFilters = {
  q: '',
  location: 'all',
  type: 'all',
  status: 'all',
  price: 'all',
};

// API helpers sometimes return {results: []}; ensure we always get a flat array.
const normaliseList = (payload) => {
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
};

// Reusable component that renders the rich card UI for a single property.
const PropertyCard = ({ property, onViewDetails }) => {
  const badge = STATUS_BADGES[property.listing_status] || STATUS_BADGES.occupied;
  const projectStatusBadge = PROJECT_STATUS_BADGES[property.status] || {
    label: property.status_display || 'In progress',
    tone: 'bg-slate-100 text-slate-600',
  };
  const typeLabel = PROPERTY_TYPE_LABELS[property.property_type] || 'Multi-family';
  const roiValue = Number(property.roi_percent || 0);
  const occupancy = Number(property.occupancy_rate || 0);
  const amenities = Array.isArray(property.amenities) ? property.amenities.slice(0, 3) : [];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card transition duration-150 ease-in-out hover:border-primary/30 hover:shadow-lg">
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {property.featured_image_url ? (
          <img
            src={sanitizeUrl(property.featured_image_url)}
            alt={property.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Image coming soon
          </div>
        )}
        {roiValue > 0 ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-amber-600 shadow">
            <span role="img" aria-hidden="true">
              ⭐
            </span>
            {roiValue.toFixed(1)}% ROI
          </span>
        ) : null}
        <span
          className={clsx(
            'absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest',
            badge.tone,
          )}
        >
          {badge.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-col gap-1">
          <span
            className={clsx(
              'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest',
              projectStatusBadge.tone,
            )}
          >
            {projectStatusBadge.label}
          </span>
          <h3 className="text-xl font-semibold text-slate-900">{property.name}</h3>
          <p className="text-sm text-slate-500">{property.location || 'Location TBA'}</p>
        </div>

        <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Units</p>
            <p className="mt-1 font-semibold text-slate-900">
              {property.units_total || '—'}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({Math.max((property.units_total || 0) - (property.units_available || 0), 0)} occupied)
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Type</p>
            <p className="mt-1 font-semibold text-slate-900">{typeLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Listing value</p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatCurrency(property.listing_price, property.listing_currency)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Year built</p>
            <p className="mt-1 font-semibold text-slate-900">{property.year_built || '2020s'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Occupancy</p>
            <p className="mt-1 font-semibold text-slate-900">{occupancy}%</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active investors</p>
            <p className="mt-1 font-semibold text-slate-900">{property.active_investors || 0}</p>
          </div>
        </div>

        {amenities.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <span key={amenity} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {amenity}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Managed by</p>
            <p className="text-sm font-semibold text-slate-900">{property.group_name || 'UEG portfolio'}</p>
          </div>
          <button
            type="button"
            onClick={() => onViewDetails(property.id)}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-slate-800"
          >
            View details
          </button>
        </div>
      </div>
    </article>
  );
};

// Buckets used to split the grid into apartments, houses, and specialty assets.
const APARTMENT_TYPES = new Set(['apartment', 'co_living', 'mixed_use']);
const HOUSING_TYPES = new Set(['townhouse', 'villa']);

const PropertiesPage = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Translate UI filter state into backend query parameters.
  const buildQuery = useCallback((state) => {
    const query = {};
    if (state.q?.trim()) {
      query.q = state.q.trim();
    }
    if (state.location && state.location !== 'all') {
      query.location = state.location;
    }
    if (state.type && state.type !== 'all') {
      query.type = state.type;
    }
    if (state.status && state.status !== 'all') {
      query.status = state.status;
    }
    if (state.price && state.price !== 'all') {
      if (state.price.endsWith('+')) {
        query.price_min = state.price.replace('+', '');
      } else {
        const [min, max] = state.price.split('-');
        if (min) {
          query.price_min = min;
        }
        if (max) {
          query.price_max = max;
        }
      }
    }
    return query;
  }, []);

  // Fire the properties endpoint and capture any errors/loading states.
  const loadListings = useCallback(
    async (state) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchPropertyListings(buildQuery(state));
        setListings(normaliseList(response));
        setLastUpdated(new Date());
      } catch (err) {
        setListings([]);
        setError(err.message || 'Unable to load properties right now.');
      } finally {
        setLoading(false);
      }
    },
    [buildQuery],
  );

  useEffect(() => {
    loadListings(filters);
  }, [filters, loadListings]);

  // Applies the text search without disturbing other active filters.
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((prev) => ({ ...prev, q: searchInput.trim() }));
  };

  // Standard select handler shared by the dropdown filters.
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Reverts form controls + search input to defaults, then reloads.
  const handleReset = () => {
    setSearchInput('');
    setFilters(defaultFilters);
  };

  // Direct investors to the Investments area to see deeper analytics.
  const handleViewDetails = (propertyId) => {
    navigate('/investments', { state: { highlightProject: propertyId } });
  };

  // Generate a sorted list of locations (with "All") derived from fetched assets.
  const locationOptions = useMemo(() => {
    const dynamicLocations = new Set(['Downtown Metro', 'City Center', 'Suburban East', 'Riverside District']);
    listings.forEach((property) => {
      if (property.location) {
        dynamicLocations.add(property.location);
      }
    });
    return ['all', ...Array.from(dynamicLocations).sort()];
  }, [listings]);

  // Headline metrics (count, units, occupancy, avg ROI) shown in hero section.
  const summary = useMemo(() => {
    if (!listings.length) {
      return { count: 0, units: 0, occupancy: 0, roi: 0 };
    }
    const aggregates = listings.reduce(
      (acc, property) => {
        const totalUnits = Number(property.units_total || 0);
        const availableUnits = Number(property.units_available || 0);
        acc.units += totalUnits;
        acc.available += availableUnits;
        acc.roi += Number(property.roi_percent || 0);
        return acc;
      },
      { units: 0, available: 0, roi: 0 },
    );
    const occupiedUnits = Math.max(aggregates.units - aggregates.available, 0);
    const occupancy = aggregates.units ? Math.round((occupiedUnits / aggregates.units) * 100) : 0;
    const roi = aggregates.roi / listings.length;
    return {
      count: listings.length,
      units: aggregates.units,
      occupancy,
      roi: Number.isFinite(roi) ? roi.toFixed(1) : '0.0',
    };
  }, [listings]);

  // Sectioned subsets used to render Apartments, Houses, and Specialty assets.
  const apartmentListings = useMemo(
    () => listings.filter((property) => APARTMENT_TYPES.has(property.property_type)),
    [listings],
  );
  const houseListings = useMemo(
    () => listings.filter((property) => HOUSING_TYPES.has(property.property_type)),
    [listings],
  );
  const otherListings = useMemo(
    () =>
      listings.filter(
        (property) => !APARTMENT_TYPES.has(property.property_type) && !HOUSING_TYPES.has(property.property_type),
      ),
    [listings],
  );

  return (
    <InvestorLayout active="properties">
      <section className="rounded-3xl bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Property marketplace</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Every property Urban Evolution Group manages</h1>
            <p className="mt-3 text-sm text-slate-600">
              From plots still raising capital to move-in ready buildings, explore every project Urban Evolution Group
              manages on behalf of investor circles. Filter by city, pricing, or availability.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Properties</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.count}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Total units</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.units}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Avg occupancy</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.occupancy}%</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Avg ROI</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.roi}%</p>
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-400">
          Updated {lastUpdated ? lastUpdated.toLocaleString() : 'today'} • All active projects
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
        <form className="flex flex-col gap-4 lg:flex-row lg:items-center" onSubmit={handleSearchSubmit}>
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
            <span className="text-slate-400">🔎</span>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by property or neighbourhood"
              className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white"
            >
              Search
            </button>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary/50 hover:text-primary"
          >
            Reset filters
          </button>
        </form>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Location</label>
            <select
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            >
              {locationOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All locations' : option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            >
              {PROPERTY_TYPE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Availability</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Pricing</label>
            <select
              name="price"
              value={filters.price}
              onChange={handleFilterChange}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            >
              {PRICE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-card">
            <span className="h-3 w-3 animate-ping rounded-full bg-primary" />
            Fetching properties...
          </div>
        </div>
      ) : error ? (
        <div className="mt-10 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 shadow-card">{error}</div>
      ) : listings.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-500 shadow-card">
          No properties match the current filters. Adjust the search to discover more opportunities.
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {apartmentListings.length ? (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Apartments & Condos</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    High-density multifamily assets with professional onsite management.
                  </h2>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {apartmentListings.length} assets
                </span>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {apartmentListings.map((property) => (
                  <PropertyCard key={property.id} property={property} onViewDetails={handleViewDetails} />
                ))}
              </div>
            </section>
          ) : null}

          {houseListings.length ? (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Houses & Townhomes</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    Low-density communities perfect for families and premium tenants.
                  </h2>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {houseListings.length} assets
                </span>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {houseListings.map((property) => (
                  <PropertyCard key={property.id} property={property} onViewDetails={handleViewDetails} />
                ))}
              </div>
            </section>
          ) : null}

          {otherListings.length ? (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Specialty assets</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    Mixed-use, commercial, or co-living buildings delivering diversified income.
                  </h2>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {otherListings.length} assets
                </span>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {otherListings.map((property) => (
                  <PropertyCard key={property.id} property={property} onViewDetails={handleViewDetails} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </InvestorLayout>
  );
};

export default PropertiesPage;
