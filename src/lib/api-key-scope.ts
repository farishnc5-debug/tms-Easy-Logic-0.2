// Pure scope check, separate from the database-backed key lookup so it can be unit-tested.
export function hasScope(scopes: string, needed: string) {
  return scopes.split(",").includes(needed);
}
