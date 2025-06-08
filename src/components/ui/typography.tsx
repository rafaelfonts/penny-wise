import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className }: TypographyProps) {
  return <h1 className={cn('heading-1', className)}>{children}</h1>;
}

export function H2({ children, className }: TypographyProps) {
  return <h2 className={cn('heading-2', className)}>{children}</h2>;
}

export function H3({ children, className }: TypographyProps) {
  return <h3 className={cn('heading-3', className)}>{children}</h3>;
}

export function H4({ children, className }: TypographyProps) {
  return <h4 className={cn('heading-4', className)}>{children}</h4>;
}

export function H5({ children, className }: TypographyProps) {
  return <h5 className={cn('heading-5', className)}>{children}</h5>;
}

export function H6({ children, className }: TypographyProps) {
  return <h6 className={cn('heading-6', className)}>{children}</h6>;
}

export function BodyText({
  children,
  className,
  size = 'normal',
}: TypographyProps & {
  size?: 'large' | 'normal' | 'small' | 'xs';
}) {
  const sizeClasses = {
    large: 'body-large',
    normal: 'body-normal',
    small: 'body-small',
    xs: 'body-xs',
  };

  return <p className={cn(sizeClasses[size], className)}>{children}</p>;
}

export function Label({ children, className }: TypographyProps) {
  return <span className={cn('label', className)}>{children}</span>;
}

export function Caption({ children, className }: TypographyProps) {
  return <span className={cn('caption', className)}>{children}</span>;
}
