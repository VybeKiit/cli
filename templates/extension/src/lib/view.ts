/** In-extension screen ids (popup + side panel share the same router). */
export type ExtensionView =
  | 'home'
  | 'login'
  | 'pricing'
  | 'dashboard'
  | 'products'
  | 'settings'
  | 'status'
  | 'changelog'
  | 'admin';

export type ExtensionSurface = 'popup' | 'sidepanel';
