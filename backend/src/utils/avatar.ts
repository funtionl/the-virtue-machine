export function resolveAvatarUrl(params: {
  avatarUrl?: string | null;
  seed: string;
}) {
  const url = (params.avatarUrl ?? "").trim();
  if (url) return url;

  const seed = encodeURIComponent(params.seed);
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed}`;
}
