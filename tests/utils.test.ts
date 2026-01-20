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

    it('should handle Tailwind class conflicts - last class wins', () => {
      // When two classes target the same property, the last one should win
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toContain('text-blue-500');
      expect(result).not.toContain('text-red-500');
    });

    it('should merge different utility classes', () => {
      const result = cn('p-4', 'm-2', 'bg-white', 'rounded-lg');
      expect(result).toContain('p-4');
      expect(result).toContain('m-2');
      expect(result).toContain('bg-white');
      expect(result).toContain('rounded-lg');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null);
      expect(result).toBe('base-class');
    });

    it('should handle empty strings', () => {
      const result = cn('base-class', '');
      expect(result).toBe('base-class');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['text-red-500', 'bg-blue-500']);
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        'base-class': true,
        'active': true,
        'disabled': false,
      });
      expect(result).toContain('base-class');
      expect(result).toContain('active');
      expect(result).not.toContain('disabled');
    });

    it('should deduplicate identical classes', () => {
      const result = cn('text-red-500', 'text-red-500', 'text-red-500');
      // Should only contain the class once
      const matches = result.match(/text-red-500/g);
      expect(matches?.length).toBe(1);
    });

    it('should handle complex Tailwind responsive classes', () => {
      const result = cn('sm:text-sm', 'md:text-base', 'lg:text-lg');
      expect(result).toContain('sm:text-sm');
      expect(result).toContain('md:text-base');
      expect(result).toContain('lg:text-lg');
    });

    it('should handle Tailwind state variants', () => {
      const result = cn('hover:bg-blue-500', 'focus:ring-2', 'active:scale-95');
      expect(result).toContain('hover:bg-blue-500');
      expect(result).toContain('focus:ring-2');
      expect(result).toContain('active:scale-95');
    });

    it('should handle dark mode classes', () => {
      const result = cn('bg-white', 'dark:bg-gray-800', 'text-black', 'dark:text-white');
      expect(result).toContain('bg-white');
      expect(result).toContain('dark:bg-gray-800');
      expect(result).toContain('text-black');
      expect(result).toContain('dark:text-white');
    });

    it('should handle arbitrary values', () => {
      const result = cn('w-[123px]', 'h-[456px]');
      expect(result).toContain('w-[123px]');
      expect(result).toContain('h-[456px]');
    });

    it('should handle complex conditional composition', () => {
      const isActive = true;
      const isDisabled = false;
      const variant = 'primary';

      const result = cn(
        'base-button',
        isActive && 'active',
        isDisabled && 'disabled',
        variant === 'primary' && 'bg-blue-500'
      );

      expect(result).toContain('base-button');
      expect(result).toContain('active');
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('disabled');
    });

    it('should return empty string for no classes', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle only falsy values', () => {
      const result = cn(false, null, undefined, '');
      expect(result).toBe('');
    });
  });
});
