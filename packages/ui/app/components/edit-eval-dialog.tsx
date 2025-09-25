'use client';

import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
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
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { updateEvalAction } from '../actions/eval-actions';
import type { Eval } from '@rectangle0/reval-core/types';

interface EditEvalDialogProps {
  evalItem: Eval;
}

export function EditEvalDialog({ evalItem }: EditEvalDialogProps) {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState(evalItem.name);
  const [notes, setNotes] = useState(evalItem.notes || '');

  // Sync local state with prop changes
  useEffect(() => {
    setName(evalItem.name);
    setNotes(evalItem.notes || '');
  }, [evalItem.name, evalItem.notes]);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const result = await updateEvalAction(evalItem.id, {
        name: name.trim(),
        notes: notes.trim() || undefined,
      });
      if (result.success) {
        setOpen(false);
        // The page will automatically revalidate due to revalidatePath in the action
      } else {
        console.error('Failed to update eval:', result.error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error updating eval:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setName(evalItem.name);
      setNotes(evalItem.notes || '');
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-radius border-border shadow-none hover:text-primary hover:border-primary"
          aria-label="Edit eval"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-radius w-full max-w-md border-border bg-background shadow-none">
        <DialogHeader>
          <DialogTitle>Edit Eval</DialogTitle>
          <DialogDescription>
            Update the name and notes for this eval.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="eval-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="eval-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter eval name"
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="eval-notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="eval-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes (optional)"
              disabled={isUpdating}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating || !name.trim()}
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}