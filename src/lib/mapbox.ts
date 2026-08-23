/**
 * Token access. Reads from env only — a literal token string anywhere in this
 * repo is task failure even if the code works. See docs/SECRETS.md.
 */
export function getMapboxToken(): string {
  const token = import.meta.env.PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error(
      'PUBLIC_MAPBOX_TOKEN is not set. Copy .env.example to .env and add your ' +
        'Mapbox pk. token. See docs/SECRETS.md.'
    );
  }
  return token;
}
