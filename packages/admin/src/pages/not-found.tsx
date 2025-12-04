import { Button } from '@longpoint/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestion className="h-12 w-12" />
          </EmptyMedia>
          <EmptyTitle className="text-2xl">404 - Page Not Found</EmptyTitle>
          <EmptyDescription className="text-base">
            The page you're looking for doesn't exist or you don't have
            permission to access it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => navigate('/')} size="lg">
            Go to Home
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
