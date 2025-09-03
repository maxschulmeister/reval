'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { deleteEvalAction } from '../actions/eval-actions';
import { useRouter } from 'next/navigation';
import type { Eval } from '@reval/core/types';

interface DeleteEvalDialogProps {
  evalItem: Eval;
  evals: Eval[];
}

export function DeleteEvalDialog({ evalItem, evals }: DeleteEvalDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteEvalAction(evalItem.id);
      if (result.success) {
        setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-radius border-border shadow-none hover:text-destructive hover:border-destructive"
          aria-label="Delete eval"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-radius w-full max-w-md border-border bg-background shadow-none">
        <DialogHeader>
          <DialogTitle>Delete Eval</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{evalItem.name}&quot;? This will permanently
            remove the eval and all its associated runs from the database. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}