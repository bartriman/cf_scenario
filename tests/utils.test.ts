import { describe, it, expect } from 'vitest';
import { cn } from '../src/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', false && 'conditional-class');
      expect(result).toContain('base-class');
      expect(result).not.toContain('conditional-class');
    });
  });
});
