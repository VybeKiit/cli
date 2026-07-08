import type { OrgMember, TenancyProvider } from '@vybekiit/tenancy/types';
import { Effect } from 'effect';

const orgs = new Map<string, { name: string; ownerUserId: string }>();
const members = new Map<string, OrgMember & { orgId: string }>();
const defaultMemberRole = 'member';

/**
 * Build the in-memory tenancy provider for local development.
 *
 * @returns A provider backed by process-local maps.
 * @example
 * const tenancy = createLocalTenancy();
 */
export const createLocalTenancy = (): TenancyProvider => ({
  name: 'local',
  createOrg: (name, ownerUserId) => {
    const orgId = `org_${Date.now()}`;
    orgs.set(orgId, { name, ownerUserId });
    return Effect.succeed({ orgId });
  },
  inviteMember: (orgId, email, role = defaultMemberRole) => {
    const userId = `user_${email}`;
    members.set(`${orgId}:${userId}`, { orgId, userId, email, role });
    return Effect.succeed(true as const);
  },
  listMembers: (orgId) => {
    const list = [...members.values()].filter((member) => member.orgId === orgId);
    return Effect.succeed<readonly OrgMember[]>(list);
  },
  removeMember: (orgId, userId) => {
    members.delete(`${orgId}:${userId}`);
    return Effect.succeed(true as const);
  },
});
