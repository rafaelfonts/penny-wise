/**
 * PENNY WISE - LIB UTILS TESTS
 * Testing the actual cn utility function from src/lib/utils.ts
 */

import { cn } from '../../../src/lib/utils';

describe('Utils Library', () => {
  describe('cn function', () => {
    test('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
    });

    test('should handle conditional classes', () => {
      const condition1 = true;
      const condition2 = false;
      const condition3: boolean | null = null;
      const condition4: boolean | undefined = undefined;
      
      expect(cn('base', condition1 && 'conditional')).toBe('base conditional');
      expect(cn('base', condition2 && 'conditional')).toBe('base');
      expect(cn('base', condition3 && 'conditional')).toBe('base');
      expect(cn('base', condition4 && 'conditional')).toBe('base');
    });

    test('should handle object-style classes', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
      expect(cn('base', { active: false, disabled: true })).toBe('base disabled');
    });

    test('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
      expect(cn(['class1', { active: true }])).toBe('class1 active');
    });

    test('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(null)).toBe('');
      expect(cn(undefined)).toBe('');
    });

    test('should merge Tailwind classes correctly', () => {
      // Test that twMerge is working - later classes should override earlier ones
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    test('should handle complex combinations', () => {
      const result = cn(
        'base-class',
        'another-class',
        { 'conditional-class': true, 'false-class': false },
        ['array-class1', 'array-class2'],
        null,
        undefined,
        'final-class'
      );
      
      expect(result).toContain('base-class');
      expect(result).toContain('another-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('false-class');
      expect(result).toContain('array-class1');
      expect(result).toContain('array-class2');
      expect(result).toContain('final-class');
    });

    test('should handle Tailwind responsive classes', () => {
      expect(cn('w-full', 'md:w-1/2', 'lg:w-1/3')).toBe('w-full md:w-1/2 lg:w-1/3');
    });

    test('should handle Tailwind state variants', () => {
      expect(cn('bg-blue-500', 'hover:bg-blue-600', 'focus:bg-blue-700')).toBe('bg-blue-500 hover:bg-blue-600 focus:bg-blue-700');
    });

    test('should handle dark mode classes', () => {
      expect(cn('bg-white', 'dark:bg-gray-900')).toBe('bg-white dark:bg-gray-900');
    });

    test('should merge conflicting Tailwind utilities', () => {
      // Test margin conflicts
      expect(cn('m-4', 'm-8')).toBe('m-8');
      expect(cn('mx-4', 'mx-8')).toBe('mx-8');
      expect(cn('mt-4', 'mt-8')).toBe('mt-8');
      
      // Test padding conflicts
      expect(cn('p-4', 'p-8')).toBe('p-8');
      expect(cn('px-4', 'px-8')).toBe('px-8');
      expect(cn('py-4', 'py-8')).toBe('py-8');
      
      // Test width conflicts
      expect(cn('w-1/2', 'w-full')).toBe('w-full');
      expect(cn('w-32', 'w-64')).toBe('w-64');
      
      // Test height conflicts
      expect(cn('h-32', 'h-64')).toBe('h-64');
      expect(cn('h-screen', 'h-full')).toBe('h-full');
    });

    test('should preserve non-conflicting classes', () => {
      const result = cn('flex', 'items-center', 'justify-between', 'p-4', 'bg-white', 'rounded-lg');
      expect(result).toBe('flex items-center justify-between p-4 bg-white rounded-lg');
    });

    test('should handle complex Tailwind class merging', () => {
      // Mix of conflicting and non-conflicting classes
      const result = cn(
        'flex items-center p-4 bg-red-500 text-white rounded-lg',
        'justify-between p-8 bg-blue-500',
        'hover:bg-blue-600'
      );
      
      expect(result).toContain('flex');
      expect(result).toContain('items-center');
      expect(result).toContain('justify-between');
      expect(result).toContain('p-8'); // Should override p-4
      expect(result).toContain('bg-blue-500'); // Should override bg-red-500
      expect(result).toContain('text-white');
      expect(result).toContain('rounded-lg');
      expect(result).toContain('hover:bg-blue-600');
      
      expect(result).not.toContain('p-4');
      expect(result).not.toContain('bg-red-500');
    });

    test('should handle arbitrary value classes', () => {
      expect(cn('w-[200px]', 'h-[100px]')).toBe('w-[200px] h-[100px]');
      expect(cn('bg-[#ff0000]', 'text-[14px]')).toBe('bg-[#ff0000] text-[14px]');
    });

    test('should handle important modifier', () => {
      expect(cn('!p-4', '!m-8')).toBe('!p-4 !m-8');
      // The cn function doesn't handle important modifiers specially
      expect(cn('p-4', '!p-8')).toBe('p-4 !p-8');
    });

    test('should handle negative values', () => {
      expect(cn('-m-4', '-mt-8')).toBe('-m-4 -mt-8');
      expect(cn('m-4', '-m-8')).toBe('-m-8');
    });

    test('should handle fraction values', () => {
      expect(cn('w-1/2', 'w-1/3')).toBe('w-1/3');
      expect(cn('w-2/3', 'w-3/4')).toBe('w-3/4');
    });

    test('should handle decimal values', () => {
      expect(cn('w-0.5', 'w-1.5')).toBe('w-1.5');
      expect(cn('p-0.5', 'p-2.5')).toBe('p-2.5');
    });
  });
}); 