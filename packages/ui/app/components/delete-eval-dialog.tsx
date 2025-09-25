'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { deleteEvalAction } from '../actions/eval-actions';
import { useRouter } from 'next/navigation';
import type { Eval } from '@rectangle0/reval-core/types';

interface DeleteEvalDialogProps {
  evalItem: Eval;
  evals: Eval[];
}

export function DeleteEvalDialog({ evalItem, evals }: DeleteEvalDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteEvalAction(evalItem.id);
      if (result.success) {
        // Redirect to another eval or home if this was the last one
        const remainingEvals = evals.filter(e => e.id !== evalItem.id);
        if (remainingEvals.length > 0) {
          router.push(`/eval/${remainingEvals[0].id}`);
        } else {
          router.push('/');
        }
      } else {
        console.error('Failed to delete eval:', result.error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error deleting eval:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-radius border-border shadow-none hover:text-destructive hover:border-destructive"
          aria-label="Delete eval"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-radius w-full max-w-md border-border bg-background shadow-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Eval</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{evalItem.name}&quot;? This will permanently
            remove the eval and all its associated runs from the database. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}