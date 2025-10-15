// Client-side wrappers around Next.js API routes for OptiMail

export async function apiOptimail(action: string, payload: unknown) {
  const res = await fetch('/api/optimail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, emailData: payload }),
  });
  if (!res.ok) throw new Error(`OptiMail API failed: ${res.status}`);
  return res.json();
}

export async function apiUpcomingEvents(limit = 5) {
  const res = await fetch(`/api/calendar/upcoming?limit=${encodeURIComponent(String(limit))}`);
  if (!res.ok) throw new Error('Failed to load upcoming events');
  return res.json();
}
