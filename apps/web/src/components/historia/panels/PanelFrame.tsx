import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface PanelFrameProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

export default function PanelFrame({
  title,
  action,
  children,
  contentClassName,
}: PanelFrameProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-stone-100 px-5 py-4">
        <h2 className="text-lg font-heading text-concreto">{title}</h2>
        {action}
      </CardHeader>
      <CardContent className={contentClassName ?? 'px-5 py-4'}>{children}</CardContent>
    </Card>
  );
}