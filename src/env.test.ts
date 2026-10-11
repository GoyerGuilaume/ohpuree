import { describe, expect, it } from 'vitest';
import { DEV_TOOLS } from './env';

describe('socle', () => {
  it('DEV_TOOLS est un booléen issu de VITE_DEV_TOOLS', () => {
    expect(typeof DEV_TOOLS).toBe('boolean');
  });
});
