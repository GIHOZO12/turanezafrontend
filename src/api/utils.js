export const toQueryString = (params = {}) => {
  const entries = Object.entries(params || {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );
  if (!entries.length) {
    return '';
  }
  const search = new URLSearchParams();
  entries.forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          search.append(key, item);
        }
      });
    } else {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

