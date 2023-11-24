import React from 'react';
import { cn } from '@/utils/classnames';

interface IProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const ExternalLink = ({ href, children, className }: IProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('no-underline', className)}
    >
      {children}
    </a>
  );
};

export default ExternalLink;
