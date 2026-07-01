import { Effect } from 'effect';
import type { OrgMember, TenancyProvider } from '../types';

const orgs = new Map<string, { name: string; ownerUserId: string }>();
const members = new Map<string, OrgMember & { orgId: string }>();

export function createLocalTenancy(): TenancyProvider {
  return {
    name: 'local',
    createOrg(name: string, ownerUserId: string) {
      const orgId = `org_${Date.now()}`;
      orgs.set(orgId, { name, ownerUserId });
      return Effect.succeed({ orgId });
    },
    inviteMember(orgId: string, email: string, role = 'member') {
      const userId = `user_${email}`;
      members.set(`${orgId}:${userId}`, { orgId, userId, email, role });
      return Effect.succeed(true as const);
    },
    listMembers(orgId: string) {
      const list = [...members.values()].filter((m) => m.orgId === orgId);
      return Effect.succeed<readonly OrgMember[]>(list);
    },
    removeMember(orgId: string, userId: string) {
      members.delete(`${orgId}:${userId}`);
      return Effect.succeed(true as const);
    },
  };
}
