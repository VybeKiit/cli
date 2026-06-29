import type { Result } from '@vybekiit/core';

export type TenancyProviderName = 'better-auth' | 'local';

export interface OrgMember {
  readonly userId: string;
  readonly email?: string | undefined;
  readonly role: string;
}

export interface TenancyProvider {
  readonly name: TenancyProviderName;
  createOrg(name: string, ownerUserId: string): Promise<Result<{ orgId: string }>>;
  inviteMember(orgId: string, email: string, role?: string | undefined): Promise<Result<true>>;
  listMembers(orgId: string): Promise<Result<readonly OrgMember[]>>;
  removeMember(orgId: string, userId: string): Promise<Result<true>>;
}
