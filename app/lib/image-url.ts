export function imageUrl(imageId: string | null): string | null {
  if (!imageId) return null;
  return `/api/images/${imageId}`;
}
