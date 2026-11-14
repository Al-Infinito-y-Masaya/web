import '@testing-library/jest-dom/vitest';
import '@/config/zod';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Unmount rendered trees between tests.
afterEach(() => cleanup());
