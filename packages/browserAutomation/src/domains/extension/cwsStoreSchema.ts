import { Either, Schema } from 'effect';

import type { CwsStoreConfig } from './store';

/**
 * Decode blank strings as a named default for scaffold-created store files.
 *
 * @param fallback - Value to use when the JSON field is blank.
 * @returns A schema that preserves non-empty strings.
 * @example
 * const KeySchema = nonEmptyOr('extension');
 */
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

/**
 * Parse `.vybekiit/store/extension/cws.json` into a typed store config.
 *
 * @param parsed - Parsed JSON value from `cws.json`.
 * @returns The normalized Chrome Web Store config.
 * @example
 * const config = parseCwsStoreConfig({ key: 'extension', name: 'Extension' });
 */
export const parseCwsStoreConfig = (parsed: unknown): CwsStoreConfig => {
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
};
