/**
 * Babel config for the Expo app. `babel-preset-expo` covers React Native, the
 * automatic JSX runtime, and expo-router — no extra plugins are needed for the
 * `@/*` path alias because Metro resolves it from this app's `tsconfig.json`.
 */
module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
