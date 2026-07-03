import { type DataProvider, resolveDataProvider } from '@vybekiit/db';
import { Effect } from 'effect';
import { type OrgMember, TenancyError, type TenancyProvider } from '../types';

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

/** Preserve a db failure's stable code/message as a {@link TenancyError}. */
const toTenancyError = (error: { readonly code: string; readonly message: string }): TenancyError =>
  new TenancyError({ code: error.code, message: error.message });

/**
 * Tenancy over the Postgres data provider (organizations + organization_members
 * preset tables). The db seam is Effect-native (ADR-0023), so each method composes
 * its {@link Effect} and maps the `DbError` channel to a {@link TenancyError}.
 */
export function createBetterAuthTenancy(
  injections: ResolveTenancyInjections = {},
): TenancyProvider {
  const data = injections.dataProvider ?? resolveDataProvider();
  return {
    name: 'better-auth',
    createOrg(name: string, ownerUserId: string) {
      const id = `org_${Date.now()}`;
      return data
        .insert<OrgRow>('organizations', { id, name, owner_user_id: ownerUserId })
        .pipe(Effect.as({ orgId: id }), Effect.mapError(toTenancyError));
    },
    inviteMember(orgId: string, email: string, role = 'member') {
      const id = `invite_${Date.now()}`;
      return data
        .insert<MemberRow>('organization_members', {
          id,
          org_id: orgId,
          user_id: id,
          email,
          role,
        })
        .pipe(Effect.as(true as const), Effect.mapError(toTenancyError));
    },
    listMembers(orgId: string) {
      return data.query<MemberRow>('organization_members', { org_id: orgId }).pipe(
        Effect.map((rows) =>
          rows.map((row): OrgMember => ({ userId: row.user_id, email: row.email, role: row.role })),
        ),
        Effect.mapError(toTenancyError),
      );
    },
    removeMember(orgId: string, userId: string) {
      return Effect.gen(function* () {
        const members = yield* data.query<MemberRow>('organization_members', {
          org_id: orgId,
          user_id: userId,
        });
        for (const member of members) {
          yield* data.remove('organization_members', member.id);
        }
        return true as const;
      }).pipe(Effect.mapError(toTenancyError));
    },
  };
}
