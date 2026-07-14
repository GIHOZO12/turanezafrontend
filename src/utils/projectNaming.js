const GENERIC_NAMES = new Set([
  'sunset apartment',
  'sunset apartments',
  'sunset',
  'apartment',
  'apartments',
  'building',
  'project',
  'residence',
]);

const PROPERTY_TYPE_LABELS = {
  apartment: 'Apartment Complex',
  townhouse: 'Townhouses',
  villa: 'Villas',
  mixed_use: 'Mixed-use',
  commercial: 'Commercial',
  co_living: 'Co-living',
};

const isGenericName = (name) => {
  const lowered = (name || '').trim().toLowerCase();
  if (!lowered) return true;
  if (GENERIC_NAMES.has(lowered)) return true;
  if (lowered.startsWith('sunset')) return true;
  if (lowered.includes('apartment') && lowered.split(' ').length <= 2) return true;
  return false;
};

export const getProjectDisplayName = (project, group) => {
  if (!project) {
    return 'Urban Evolution Residence';
  }
  const name = (project.displayName || project.name || '').trim();
  if (name && !isGenericName(name)) {
    return name;
  }

  const location = (project.location || '').trim();
  const typeKey = project.type || project.propertyType || project.property_type;
  const typeLabel = PROPERTY_TYPE_LABELS[typeKey] || 'Residence';

  if (location && typeLabel) {
    return `${location} • ${typeLabel}`;
  }
  if (location) {
    return location;
  }
  if (group?.name && typeLabel) {
    return `${group.name} • ${typeLabel}`;
  }
  if (typeLabel) {
    return `Urban Evolution ${typeLabel}`;
  }
  return 'Urban Evolution Residence';
};
