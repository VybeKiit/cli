import { setupServer } from 'msw/node';
import { wirePointHandlers } from './handlers';

export const mswServer = setupServer(...wirePointHandlers);
