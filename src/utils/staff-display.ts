export type OrganizationNameSource = 'organizationName' | 'organization.name' | 'organizationId.name' | 'fallback';

export function resolveOrganizationName(source: Record<string, unknown>): { name: string; source: OrganizationNameSource } {
  const directOrganizationName = source.organizationName;
  if (typeof directOrganizationName === 'string' && directOrganizationName.trim().length > 0) {
    return { name: directOrganizationName.trim(), source: 'organizationName' };
  }

  const organization = source.organization;
  if (organization && typeof organization === 'object') {
    const organizationName = (organization as { name?: unknown }).name;
    if (typeof organizationName === 'string' && organizationName.trim().length > 0) {
      return { name: organizationName.trim(), source: 'organization.name' };
    }
  }

  const organizationId = source.organizationId;
  if (organizationId && typeof organizationId === 'object') {
    const organizationName = (organizationId as { name?: unknown }).name;
    if (typeof organizationName === 'string' && organizationName.trim().length > 0) {
      return { name: organizationName.trim(), source: 'organizationId.name' };
    }
  }

  return { name: 'Organization', source: 'fallback' };
}

export function getOrganizationName(source: Record<string, unknown>): string {
  return resolveOrganizationName(source).name;
}

export function toTitleCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildFrontendStaffId(source: Record<string, unknown>, backendId: string): string {
  const organizationName = getOrganizationName(source);
  const organizationPrefix = organizationName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'ORG';
  const uuidPrefix = backendId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || '0000';
  return `${organizationPrefix}-${uuidPrefix}`;
}

export function buildFrontendStaffIdWithSource(
  source: Record<string, unknown>,
  backendId: string,
): { id: string; organizationNameSource: OrganizationNameSource } {
  const resolved = resolveOrganizationName(source);
  const organizationPrefix = resolved.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'ORG';
  const uuidPrefix = backendId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || '0000';
  return {
    id: `${organizationPrefix}-${uuidPrefix}`,
    organizationNameSource: resolved.source,
  };
}
