export async function searchAddresses(query, signal) {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error('Geoapify API key is not configured.');

  const params = new URLSearchParams({
    text: query,
    format: 'json',
    filter: 'countrycode:in',
    limit: '8',
    apiKey,
  });
  const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`, { signal });
  if (!response.ok) throw new Error('Unable to search addresses right now.');
  const data = await response.json();
  return (data.results || []).map((place) => ({
    id: place.place_id || `${place.lat}-${place.lon}-${place.formatted}`,
    title: place.address_line1 || place.city || place.name || place.formatted,
    label: place.formatted,
  }));
}
