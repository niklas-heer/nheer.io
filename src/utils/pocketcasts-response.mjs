export async function readPocketResponse(response, field) {
  if (!response.ok) throw new Error(`Pocket Casts request failed (HTTP ${response.status})`);
  const data = await response.json();
  if (field === 'stats') {
    const fields = ['timeListened', 'timeSilenceRemoval', 'timeSkipping', 'timeIntroSkipping', 'timeVariableSpeed'];
    if (!data || typeof data.timeListened !== 'number' || fields.some(key => data[key] !== undefined && (typeof data[key] !== 'number' || !Number.isFinite(data[key]) || data[key] < 0))) {
      throw new Error('Pocket Casts returned invalid listening statistics');
    }
  } else if (!data || !Array.isArray(data[field])) {
    throw new Error(`Pocket Casts returned invalid ${field}`);
  }
  return data;
}

export function canAttributeToToday(previousDate, today) {
  if (!previousDate) return false;
  const previous = new Date(previousDate).toISOString().slice(0, 10);
  const days = (Date.parse(today) - Date.parse(previous)) / 86400000;
  return days >= 0 && days <= 1;
}
