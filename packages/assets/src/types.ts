import { Data, type Effect, Schema } from 'effect';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));
const PositiveInteger = Schema.Number.pipe(Schema.int(), Schema.positive());

/** Delivery backends derived from hosting and storage config. */
export const AssetDeliveryProviderName = Schema.Literal(
  'local',
  'cloudflare-r2',
  'cloudflare-supabase',
  'vercel',
  'aws-s3',
);

/** Static type inferred from {@link AssetDeliveryProviderName}. */
export type AssetDeliveryProviderNameType = Schema.Schema.Type<typeof AssetDeliveryProviderName>;

/** Build optimizer input paths and manifest name. */
export const OptimizeBuildOptions = Schema.Struct({
  sourceDir: NonEmptyString,
  outputDir: Schema.optional(NonEmptyString),
  manifestName: Schema.optional(NonEmptyString),
});

/** Static type inferred from {@link OptimizeBuildOptions}. */
export type OptimizeBuildOptionsType = Schema.Schema.Type<typeof OptimizeBuildOptions>;

/** Backward-compatible build optimizer options alias during the Schema migration. */
export type OptimizeBuildOptions = OptimizeBuildOptionsType;

/** One optimized asset manifest entry. */
export const AssetManifestEntry = Schema.Struct({
  source: NonEmptyString,
  optimized: NonEmptyString,
  variants: Schema.Record({ key: Schema.String, value: Schema.String }),
});

/** Static type inferred from {@link AssetManifestEntry}. */
export type AssetManifestEntryType = Schema.Schema.Type<typeof AssetManifestEntry>;

/** Backward-compatible manifest entry alias during the Schema migration. */
export type AssetManifestEntry = AssetManifestEntryType;

/** Manifest mapping source asset paths to optimized variants. */
export const AssetManifest = Schema.Struct({
  files: Schema.Record({ key: Schema.String, value: AssetManifestEntry }),
});

/** Static type inferred from {@link AssetManifest}. */
export type AssetManifestType = Schema.Schema.Type<typeof AssetManifest>;

/** Backward-compatible manifest alias during the Schema migration. */
export type AssetManifest = AssetManifestType;

/** Build optimizer result containing the manifest and processing count. */
export const OptimizeBuildResult = Schema.Struct({
  manifest: AssetManifest,
  manifestPath: NonEmptyString,
  processedCount: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
});

/** Static type inferred from {@link OptimizeBuildResult}. */
export type OptimizeBuildResultType = Schema.Schema.Type<typeof OptimizeBuildResult>;

/** Backward-compatible build optimizer result alias during the Schema migration. */
export type OptimizeBuildResult = OptimizeBuildResultType;

/** CDN URL transform options for remote assets. */
export const AssetUrlOptions = Schema.Struct({
  width: Schema.optional(PositiveInteger),
  format: Schema.optional(Schema.Literal('webp', 'avif', 'auto')),
});

/** Static type inferred from {@link AssetUrlOptions}. */
export type AssetUrlOptionsType = Schema.Schema.Type<typeof AssetUrlOptions>;

/** Backward-compatible asset URL options alias during the Schema migration. */
export type AssetUrlOptions = AssetUrlOptionsType;

/** Expected asset optimization or delivery failures callers may recover from. */
export class AssetError extends Data.TaggedError('AssetError')<{
  readonly code:
    | 'ASSET_CONFIG_INVALID'
    | 'ASSET_PROVIDER_UNSUPPORTED'
    | 'ASSET_OPTIMIZE_FAILED'
    | 'ASSET_DELIVERY_NOT_CONFIGURED'
    | 'ASSET_MANIFEST_MISSING'
    | 'ASSET_MANIFEST_INVALID'
    | 'ASSET_MANIFEST_ENTRY_MISSING';
  readonly message: string;
}> {}

/** Effect service contract for asset optimization and URL delivery. */
export type AssetDeliveryService = {
  readonly name: AssetDeliveryProviderNameType;
  readonly optimizeForBuild: (
    options: OptimizeBuildOptionsType,
  ) => Effect.Effect<OptimizeBuildResultType, AssetError>;
  readonly url: (src: string, opts?: AssetUrlOptionsType | undefined) => string;
  readonly verifyDelivery: () => Effect.Effect<true, AssetError>;
};

/** Backward-compatible alias for the asset delivery service shape during the Effect migration. */
export type AssetDeliveryProvider = AssetDeliveryService;
