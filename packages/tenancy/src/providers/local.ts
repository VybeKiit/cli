import { ok, type Result } from '@vybekiit/core';
import type { OrgMember, TenancyProvider } from '../types';

const orgs = new Map<string, { name: string; ownerUserId: string }>();
const members = new Map<string, OrgMember & { orgId: string }>();

export function createLocalTenancy(): TenancyProvider {
  return {
    name: 'local',
    async createOrg(name: string, ownerUserId: string): Promise<Result<{ orgId: string }>> {
      const orgId = `org_${Date.now()}`;
      orgs.set(orgId, { name, ownerUserId });
      return ok({ orgId });
    },
    async inviteMember(orgId: string, email: string, role = 'member'): Promise<Result<true>> {
      const userId = `user_${email}`;
      members.set(`${orgId}:${userId}`, { orgId, userId, email, role });
      return ok(true);
    },
    async listMembers(orgId: string): Promise<Result<readonly OrgMember[]>> {
      const list = [...members.values()].filter((m) => m.orgId === orgId);
      return ok(list);
    },
    async removeMember(orgId: string, userId: string): Promise<Result<true>> {
      members.delete(`${orgId}:${userId}`);
      return ok(true);
    },
  };
}
