import React from 'react';
import { cn } from '@/utils/classnames';

interface IProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  color?: string;
}

const ExternalLink = ({ href, children, className, color }: IProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('no-underline', className)}
      style={{ color: color }}
    >
      {children}
    </a>
  );
};

export default ExternalLink;
