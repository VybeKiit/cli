import { resolveDataProvider } from '@vybekiit/db';
import { fail, ok, type Result } from '@vybekiit/core';
import type { OrgMember, TenancyProvider } from '../types';

interface OrgRow {
  readonly id: string;
  readonly name: string;
  readonly ownerUserId: string;
}

interface MemberRow {
  readonly id: string;
  readonly orgId: string;
  readonly userId: string;
  readonly email: string;
  readonly role: string;
}

export function createBetterAuthTenancy(): TenancyProvider {
  const data = resolveDataProvider();
  return {
    name: 'better-auth',
    async createOrg(name: string, ownerUserId: string): Promise<Result<{ orgId: string }>> {
      const id = `org_${Date.now()}`;
      const result = await data.insert<OrgRow>('organizations', {
        id,
        name,
        ownerUserId,
      });
      if (!result.ok) return fail(result.error.code, result.error.message);
      return ok({ orgId: id });
    },
    async inviteMember(orgId: string, email: string, role = 'member'): Promise<Result<true>> {
      const id = `invite_${Date.now()}`;
      const result = await data.insert<MemberRow>('organization_members', {
        id,
        orgId,
        userId: id,
        email,
        role,
      });
      if (!result.ok) return fail(result.error.code, result.error.message);
      return ok(true);
    },
    async listMembers(orgId: string): Promise<Result<readonly OrgMember[]>> {
      const result = await data.query<MemberRow>('organization_members', { orgId });
      if (!result.ok) return fail(result.error.code, result.error.message);
      return ok(
        result.value.map((row) => ({
          userId: row.userId,
          email: row.email,
          role: row.role,
        })),
      );
    },
    async removeMember(orgId: string, userId: string): Promise<Result<true>> {
      const members = await data.query<MemberRow>('organization_members', { orgId, userId });
      if (!members.ok) return members;
      for (const member of members.value) {
        const removed = await data.remove('organization_members', member.id);
        if (!removed.ok) return removed;
      }
      return ok(true);
    },
  };
}
