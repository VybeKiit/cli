import { setupServer } from 'msw/node';
import { wirePointHandlers } from './handlers';

/** MSW server used by web template tests to intercept network calls. */
export const mswServer = setupServer(...wirePointHandlers);
