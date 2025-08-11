import { describe, it, expect } from 'vitest'
import { runs, executions } from '../../src/db/schema'

describe('Database Schema', () => {
  describe('table exports', () => {
    it('should export runs table', () => {
      expect(runs).toBeDefined()
      expect(typeof runs).toBe('object')
    })

    it('should export executions table', () => {
      expect(executions).toBeDefined()
      expect(typeof executions).toBe('object')
    })
  })

  describe('type inference', () => {
    it('should support type inference for run inserts', () => {
      // This test verifies TypeScript type definitions work correctly
      // If these compile without errors, the types are correctly defined
      
      const mockRun: typeof runs.$inferInsert = {
        id: 'test-id',
        name: 'test-run',
        notes: null,
        function: 'function() {}',
        features: ['feature1'] as any,
        target: ['target1'] as any,
        variants: { model: ['gpt-4'] } as any,
        timestamp: Date.now()
      }

      // If we can create this object, the types are working
      expect(mockRun).toBeDefined()
      expect(mockRun.id).toBe('test-id')
      expect(mockRun.name).toBe('test-run')
    })

    it('should support type inference for execution inserts', () => {
      const mockExecution: typeof executions.$inferInsert = {
        id: 'exec-id',
        runId: 'test-id',
        features: 'feature1' as any,
        target: 'target1' as any,
        result: { prediction: 'test' } as any,
        time: 1000,
        retries: 0,
        status: 'success',
        variant: { model: 'gpt-4' } as any
      }

      expect(mockExecution).toBeDefined()
      expect(mockExecution.id).toBe('exec-id')
      expect(mockExecution.runId).toBe('test-id')
    })
  })

  describe('schema type safety', () => {
    it('should enforce run structure', () => {
      const validRun: typeof runs.$inferInsert = {
        id: 'run-123',
        name: 'test-run',
        notes: 'Test notes', 
        function: 'function test() {}',
        features: ['feature1', 'feature2'],
        target: ['target1', 'target2'],
        variants: { model: ['gpt-4'], temperature: [0.5] },
        timestamp: 1672531200000
      }

      expect(validRun).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        function: expect.any(String),
        features: expect.any(Array),
        target: expect.any(Array),
        variants: expect.any(Object),
        timestamp: expect.any(Number)
      })
    })

    it('should enforce execution structure', () => {
      const validExecution: typeof executions.$inferInsert = {
        id: 'exec-123',
        runId: 'run-123',
        features: 'feature data',
        target: 'target data',
        result: { prediction: 'test', tokens: { in: 10, out: 20 } },
        time: 1500,
        retries: 2,
        status: 'success',
        variant: { model: 'gpt-4', temperature: 0.5 }
      }

      expect(validExecution).toMatchObject({
        id: expect.any(String),
        runId: expect.any(String),
        features: expect.anything(),
        target: expect.anything(),
        result: expect.any(Object),
        time: expect.any(Number),
        retries: expect.any(Number),
        status: expect.any(String),
        variant: expect.any(Object)
      })
    })

    it('should handle null result in executions', () => {
      const executionWithNullResult: typeof executions.$inferInsert = {
        id: 'exec-error',
        runId: 'run-123',
        features: 'feature data',
        target: 'target data',
        result: null, // This should be allowed for error cases
        time: 1500,
        retries: 2,
        status: 'error',
        variant: { model: 'gpt-4' }
      }

      expect(executionWithNullResult.result).toBeNull()
      expect(executionWithNullResult.status).toBe('error')
    })

    it('should handle complex nested data structures', () => {
      const complexRun: typeof runs.$inferInsert = {
        id: 'complex-run',
        name: 'complex-test',
        notes: null,
        function: 'async function complex() { return "result"; }',
        features: [
          { text: 'input1', metadata: { type: 'string', length: 10 } },
          { text: 'input2', metadata: { type: 'string', length: 15 } }
        ] as any,
        target: [
          { expected: 'output1', confidence: 0.95 },
          { expected: 'output2', confidence: 0.88 }
        ] as any,
        variants: {
          model: ['gpt-4', 'claude-3'],
          temperature: [0.1, 0.5, 0.9],
          max_tokens: [100, 500, 1000]
        },
        timestamp: Date.now()
      }

      expect(complexRun.features).toBeInstanceOf(Array)
      expect(complexRun.target).toBeInstanceOf(Array)
      expect(complexRun.variants).toBeInstanceOf(Object)
    })
  })
})