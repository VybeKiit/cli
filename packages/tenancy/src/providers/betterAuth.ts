import { resolveDataProvider, type DataProvider } from '@vybekiit/db';
import { fail, ok, type Result } from '@vybekiit/core';
import type { OrgMember, TenancyProvider } from '../types';

export interface ResolveTenancyInjections {
  readonly dataProvider?: DataProvider;
}

interface OrgRow {
  readonly id: string;
  readonly name: string;
  readonly owner_user_id: string;
}

interface MemberRow {
  readonly id: string;
  readonly org_id: string;
  readonly user_id: string;
  readonly email: string;
  readonly role: string;
}

export function createBetterAuthTenancy(
  injections: ResolveTenancyInjections = {},
): TenancyProvider {
  const data = injections.dataProvider ?? resolveDataProvider();
  return {
    name: 'better-auth',
    async createOrg(name: string, ownerUserId: string): Promise<Result<{ orgId: string }>> {
      const id = `org_${Date.now()}`;
      const result = await data.insert<OrgRow>('organizations', {
        id,
        name,
        owner_user_id: ownerUserId,
      });
      if (!result.ok) return fail(result.error.code, result.error.message);
      return ok({ orgId: id });
    },
    async inviteMember(orgId: string, email: string, role = 'member'): Promise<Result<true>> {
      const id = `invite_${Date.now()}`;
      const result = await data.insert<MemberRow>('organization_members', {
        id,
        org_id: orgId,
        user_id: id,
        email,
        role,
      });
      if (!result.ok) return fail(result.error.code, result.error.message);
      return ok(true);
    },
    async listMembers(orgId: string): Promise<Result<readonly OrgMember[]>> {
      const result = await data.query<MemberRow>('organization_members', { org_id: orgId });
      if (!result.ok) return fail(result.error.code, result.error.message);
      return ok(
        result.value.map((row) => ({
          userId: row.user_id,
          email: row.email,
          role: row.role,
        })),
      );
    },
    async removeMember(orgId: string, userId: string): Promise<Result<true>> {
      const members = await data.query<MemberRow>('organization_members', {
        org_id: orgId,
        user_id: userId,
      });
      if (!members.ok) return members;
      for (const member of members.value) {
        const removed = await data.remove('organization_members', member.id);
        if (!removed.ok) return removed;
      }
      return ok(true);
    },
  };
}
