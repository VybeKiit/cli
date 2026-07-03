import { Either, Schema } from 'effect';

import type { CwsStoreConfig } from './store';

const nonEmptyOr = (fallback: string) =>
  Schema.transform(Schema.String, Schema.String, {
    strict: true,
    decode: (value) => (value.length > 0 ? value : fallback),
    encode: (value) => value,
  });

export const CwsStoreConfigSchema = Schema.Struct({
  chromeWebStoreId: Schema.optionalWith(Schema.String, { default: () => '' }),
  key: Schema.optionalWith(nonEmptyOr('extension'), { default: () => 'extension' }),
  name: Schema.optionalWith(nonEmptyOr('Extension'), { default: () => 'Extension' }),
  version: Schema.optional(Schema.String),
});

const decodeCwsStoreConfig = Schema.decodeUnknownEither(CwsStoreConfigSchema);

/** Parse `.vybekiit/store/extension/cws.json` into a typed store config. */
export function parseCwsStoreConfig(parsed: unknown): CwsStoreConfig {
  const result = decodeCwsStoreConfig(parsed);
  if (Either.isLeft(result)) {
    throw new Error('cws.json must be a JSON object.');
  }
  const { chromeWebStoreId, key, name, version } = result.right;
  return {
    chromeWebStoreId,
    key,
    name,
    ...(version === undefined ? {} : { version }),
  };
}
