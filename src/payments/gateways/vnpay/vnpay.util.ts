export function formatDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);
}

export function sortObject(obj: any) {
  const sorted = {};
  const keys = Object.keys(obj).sort();

  keys.forEach((key) => {
    sorted[key] = obj[key];
  });

  return sorted;
}
