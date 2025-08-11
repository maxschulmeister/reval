import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Run, Execution } from '../../src/types/db'
import { Status } from '../../src/types/db'
import { saveRun } from '../../src/db/save-run'

// Mock the database
vi.mock('../../src/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined)
    })
  }
}))

import { db } from '../../src/db'

describe('Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveRun', () => {
    const mockRun: Run = {
      id: 'run-123',
      name: 'test-run',
      notes: 'Test notes',
      function: 'function test() { return "hello"; }',
      features: ['input1', 'input2'],
      target: ['output1', 'output2'],
      variants: { model: ['gpt-4'], temperature: [0.5] },
      timestamp: 1672531200000
    }

    const mockExecutions: Execution[] = [
      {
        id: 'exec-123',
        runId: 'run-123',
        features: 'input1',
        target: 'output1',
        result: {
          prediction: 'test prediction',
          tokens: { in: 10, out: 20 }
        },
        time: 1500,
        retries: 0,
        status: Status.Success,
        variant: { model: 'gpt-4', temperature: 0.5 }
      },
      {
        id: 'exec-124',
        runId: 'run-123',
        features: 'input2',
        target: 'output2',
        result: {
          prediction: 'another prediction',
          tokens: { in: 15, out: 25 }
        },
        time: 2000,
        retries: 1,
        status: Status.Success,
        variant: { model: 'gpt-4', temperature: 0.5 }
      }
    ]

    it('should save run successfully', async () => {
      // Mock the db.insert chain
      const mockValues = vi.fn().mockResolvedValue(undefined)
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

      await saveRun(mockRun, mockExecutions)

      // Verify run was inserted
      expect(db.insert).toHaveBeenCalledTimes(3) // 1 run + 2 executions
      expect(mockValues).toHaveBeenCalledWith(mockRun)
    })

    it('should save all executions successfully', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

      await saveRun(mockRun, mockExecutions)

      // Verify executions were inserted
      expect(mockValues).toHaveBeenCalledWith(mockExecutions[0])
      expect(mockValues).toHaveBeenCalledWith(mockExecutions[1])
    })

    it('should handle run insertion errors', async () => {
      const mockValues = vi.fn().mockRejectedValue(new Error('Database error'))
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

      await expect(saveRun(mockRun, mockExecutions)).rejects.toThrow('Database error')
    })

    it('should handle execution insertion errors', async () => {
      const mockValues = vi.fn()
        .mockResolvedValueOnce(undefined) // Run insertion succeeds
        .mockRejectedValue(new Error('Execution database error')) // Execution insertion fails
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

      await expect(saveRun(mockRun, mockExecutions)).rejects.toThrow('Execution database error')
    })

    it('should handle single execution', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

      await saveRun(mockRun, [mockExecutions[0]])

      expect(mockValues).toHaveBeenCalledTimes(2) // 1 run + 1 execution
      expect(mockValues).toHaveBeenCalledWith(mockRun)
      expect(mockValues).toHaveBeenCalledWith(mockExecutions[0])
    })

    it('should handle empty executions array', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

      await saveRun(mockRun, [])

      expect(mockValues).toHaveBeenCalledTimes(1) // Only run insertion
      expect(mockValues).toHaveBeenCalledWith(mockRun)
    })

    it('should handle executions with error status', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

      const errorExecution: Execution = {
        ...mockExecutions[0],
        id: 'exec-error',
        status: Status.Error,
        result: null
      }

      await saveRun(mockRun, [errorExecution])

      expect(mockValues).toHaveBeenCalledWith(errorExecution)
    })

    it('should handle complex result structures', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

      const complexExecution: Execution = {
        ...mockExecutions[0],
        result: {
          prediction: 'complex prediction',
          tokens: { in: 100, out: 200 },
          metadata: { confidence: 0.95, model: 'gpt-4' },
          timing: { start: 1000, duration: 500 }
        }
      }

      await saveRun(mockRun, [complexExecution])

      expect(mockValues).toHaveBeenCalledWith(complexExecution)
    })

    it('should handle complex variant structures', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

      const complexVariantRun: Run = {
        ...mockRun,
        variants: {
          model: ['gpt-4', 'claude-3'],
          temperature: [0.1, 0.5, 0.9],
          max_tokens: [100, 500, 1000]
        }
      }

      await saveRun(complexVariantRun, mockExecutions)

      expect(mockValues).toHaveBeenCalledWith(complexVariantRun)
    })

    it('should handle complex features structures', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined)
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

      const complexFeaturesRun: Run = {
        ...mockRun,
        features: [
          { text: 'input1', metadata: { length: 10 } },
          { text: 'input2', metadata: { length: 20 } }
        ] as any
      }

      await saveRun(complexFeaturesRun, mockExecutions)

      expect(mockValues).toHaveBeenCalledWith(complexFeaturesRun)
    })
  })
})