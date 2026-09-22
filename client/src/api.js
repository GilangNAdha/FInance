/** API helpers — semua request ke backend Express */

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON (mis. download Excel) */
  }
  if (!res.ok) {
    const msg =
      data && data.errors
        ? Array.isArray(data.errors)
          ? data.errors.join(' ')
          : data.errors
        : `Permintaan gagal (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  list: () => request('/api/transactions'),
  stats: () => request('/api/stats'),
  create: (payload) =>
    request('/api/transactions', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) =>
    request(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/transactions/${id}`, { method: 'DELETE' }),
};

/** Bangun URL export Excel sesuai filter aktif */
export function exportUrl({ type = 'all', from = '', to = '' } = {}) {
  const params = new URLSearchParams();
  params.set('type', type);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return `/api/export/excel?${params.toString()}`;
}
