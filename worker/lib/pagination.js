export const ADMIN_PAGE_SIZE = 100;
export const MAX_PAGE_OFFSET = 100_000;

export function getPageOffset(request) {
  const value = Number.parseInt(new URL(request.url).searchParams.get("offset") || "0", 10);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, MAX_PAGE_OFFSET);
}

export function getPageMetadata(offset, total, returned, pageSize = ADMIN_PAGE_SIZE) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const nextOffset = offset + returned;
  return {
    offset,
    total: safeTotal,
    nextOffset: nextOffset < safeTotal ? nextOffset : null,
    pageSize,
  };
}
