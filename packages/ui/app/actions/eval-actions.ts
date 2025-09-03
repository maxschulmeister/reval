'use server';

import { deleteEval, updateEval } from '@reval/core';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteEvalAction(evalId: string) {
  try {
    await deleteEval(evalId);
    revalidatePath('/');
    revalidatePath('/eval/[id]', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete eval:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete eval' 
    };
  }
}

export async function updateEvalAction(
  evalId: string, 
  updates: { name?: string; notes?: string }
) {
  try {
    const updatedEval = await updateEval(evalId, updates);
    revalidatePath('/');
    revalidatePath('/eval/[id]', 'page');
    return { success: true, eval: updatedEval };
  } catch (error) {
    console.error('Failed to update eval:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update eval' 
    };
  }
}