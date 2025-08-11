import { describe, it, expect } from 'vitest'
import { getFeatures, getVariant, defineConfig, combineArgs } from '../../src/utils'

describe('Utility Functions', () => {
  describe('getFeatures()', () => {
    it('should extract features from array arguments', () => {
      const arg = ['input1', 'model-param', 'extra-data']
      const features = ['input1', 'input2', 'input3']
      
      const result = getFeatures(arg, features)
      expect(result).toBe('input1')
    })

    it('should extract features from object arguments', () => {
      const arg = { text: 'input2', model: 'gpt-4', temperature: 0.5 }
      const features = ['input1', 'input2', 'input3']
      
      const result = getFeatures(arg, features)
      expect(result).toBe('input2')
    })

    it('should handle nested object structures', () => {
      // The getFeatures function only checks direct Object.values(), not deep nesting
      const arg = {
        content: 'input3', // Direct property value that matches features
        metadata: { type: 'text' }
      }
      const features = ['input1', 'input2', 'input3']
      
      const result = getFeatures(arg, features)
      expect(result).toBe('input3')
    })

    it('should handle array of objects', () => {
      const arg = [
        { file: 'input1', type: 'pdf' }, // This object contains 'input1' value
        { model: 'gpt-4', temperature: 0.7 }
      ]
      const features = ['input1', 'input2']
      
      const result = getFeatures(arg, features)
      expect(result).toBe('input1')
    })

    it('should return undefined for non-matching features', () => {
      const arg = { text: 'unknown', model: 'gpt-4' }
      const features = ['input1', 'input2', 'input3']
      
      const result = getFeatures(arg, features)
      expect(result).toBeUndefined()
    })

    it('should handle single argument case', () => {
      const arg = 'input2'
      const features = ['input1', 'input2', 'input3']
      
      const result = getFeatures(arg, features)
      expect(result).toBe('input2')
    })

    it('should handle object with matching value', () => {
      const arg = {
        someKey: 'input1', // Direct value match
        otherData: 'ignored'
      }
      const features = ['input1', 'input2']
      
      const result = getFeatures(arg, features)
      expect(result).toBe('input1')
    })
  })

  describe('getVariant()', () => {
    const testVariants = {
      model: ['gpt-4', 'claude', 'gemini'],
      temperature: [0.1, 0.5, 0.9],
      max_tokens: [100, 500, 1000]
    }

    it('should match variants in array arguments', () => {
      const arg = ['input-text', 'claude', 0.5, 500]
      
      const result = getVariant(arg, testVariants)
      expect(result).toEqual({
        model: 'claude',
        temperature: 0.5,
        max_tokens: 500
      })
    })

    it('should match variants in object arguments', () => {
      const arg = {
        text: 'input-text',
        model: 'gpt-4',
        temperature: 0.9,
        max_tokens: 1000 // Direct property, not nested
      }
      
      const result = getVariant(arg, testVariants)
      expect(result).toEqual({
        model: 'gpt-4',
        temperature: 0.9,
        max_tokens: 1000
      })
    })

    it('should handle multiple variant types', () => {
      const variants = {
        model: ['gpt-4', 'claude'],
        temperature: [0.1, 0.7],
        system_prompt: ['default', 'creative', 'analytical'],
        format: ['json', 'text', 'markdown']
      }
      
      const arg = {
        model: 'claude',
        temperature: 0.7,
        system_prompt: 'analytical',
        format: 'json',
        extra: 'ignored'
      }
      
      const result = getVariant(arg, variants)
      expect(result).toEqual({
        model: 'claude',
        temperature: 0.7,
        system_prompt: 'analytical',
        format: 'json'
      })
    })

    it('should handle partial matches', () => {
      const arg = ['input-text', 'gpt-4', 'unknown-value']
      
      const result = getVariant(arg, testVariants)
      expect(result).toEqual({
        model: 'gpt-4'
      })
    })

    it('should return empty object for no matches', () => {
      const arg = ['input-text', 'unknown-model', 'unknown-temp']
      
      const result = getVariant(arg, testVariants)
      expect(result).toEqual({})
    })

    it('should handle direct object variant matching', () => {
      const arg = {
        model: 'gemini',
        temperature: 0.1,
        max_tokens: 100 // All direct properties
      }
      
      const result = getVariant(arg, testVariants)
      expect(result).toEqual({
        model: 'gemini',
        temperature: 0.1,
        max_tokens: 100
      })
    })

    it('should handle array of objects with variants', () => {
      const arg = [
        { text: 'input' },
        { model: 'claude', temperature: 0.5 },
        { max_tokens: 500 } // Direct property in array element
      ]
      
      const result = getVariant(arg, testVariants)
      expect(result).toEqual({
        model: 'claude',
        temperature: 0.5,
        max_tokens: 500
      })
    })
  })

  describe('defineConfig()', () => {
    it('should return config object unchanged', () => {
      const mockFunction = async () => ({ result: 'test' })
      const config = {
        concurrency: 5,
        retries: 2,
        interval: 1000,
        data: {
          path: '/tmp/test.csv',
          target: 'output',
          variants: { model: ['gpt-4'] }
        },
        run: {
          function: mockFunction,
          args: () => ['test'],
          result: (r: any) => ({ prediction: r.result, tokens: { in: 10, out: 20 } })
        }
      }
      
      const result = defineConfig(config)
      expect(result).toBe(config) // Should return same reference
      expect(result).toEqual(config)
    })

    it('should provide proper TypeScript inference', () => {
      // This test verifies that TypeScript types work correctly
      const testFunction = async (input: string) => ({ response: input })
      
      const config = defineConfig({
        data: {
          variants: { model: ['gpt-4'] }
        },
        run: {
          function: testFunction,
          args: (context) => [context.features[0]],
          result: (response) => ({
            prediction: response.response,
            tokens: { in: 5, out: 10 }
          })
        }
      })
      
      // If this compiles without errors, TypeScript inference is working
      expect(config).toBeDefined()
      expect(config.run.function).toBe(testFunction)
      expect(typeof config.run.args).toBe('function')
      expect(typeof config.run.result).toBe('function')
    })

    it('should handle minimal config', () => {
      const minimalFunction = async () => ({ data: 'test' })
      const minimalConfig = {
        data: { variants: { model: ['test'] } },
        run: {
          function: minimalFunction,
          args: () => [],
          result: (r: any) => ({ prediction: r.data, tokens: { in: 1, out: 1 } })
        }
      }
      
      const result = defineConfig(minimalConfig)
      expect(result).toEqual(minimalConfig)
    })
  })

  describe('combineArgs() - comprehensive tests', () => {
    it('should return empty array for empty input', () => {
      const result = combineArgs([])
      expect(result).toEqual([])
    })

    it('should handle simple array combinations', () => {
      const args = [
        ['a', 'b'],
        [1, 2]
      ]
      const result = combineArgs(args)
      expect(result).toEqual([
        ['a', 1],
        ['a', 2], 
        ['b', 1],
        ['b', 2]
      ])
    })

    it('should handle object with array values', () => {
      const args = [{
        model: ['gpt-4', 'claude'],
        temperature: [0.1, 0.7]
      }]
      const result = combineArgs(args)
      expect(result).toEqual([
        [{ model: 'gpt-4', temperature: 0.1 }],
        [{ model: 'gpt-4', temperature: 0.7 }],
        [{ model: 'claude', temperature: 0.1 }],
        [{ model: 'claude', temperature: 0.7 }]
      ])
    })

    it('should handle three-way combinations', () => {
      const args = [
        ['x', 'y'],
        [1, 2],
        ['a', 'b']
      ]
      const result = combineArgs(args)
      expect(result).toHaveLength(8) // 2 * 2 * 2
      
      // Check that it contains the expected combinations (order might vary)
      const resultStrings = result.map(arr => JSON.stringify(arr))
      expect(resultStrings).toContain(JSON.stringify(['x', 1, 'a']))
      expect(resultStrings).toContain(JSON.stringify(['y', 2, 'b']))
      
      // Verify all combinations are present
      const expectedCombinations = [
        ['x', 1, 'a'], ['x', 1, 'b'], ['x', 2, 'a'], ['x', 2, 'b'],
        ['y', 1, 'a'], ['y', 1, 'b'], ['y', 2, 'a'], ['y', 2, 'b']
      ]
      
      expectedCombinations.forEach(expected => {
        expect(resultStrings).toContain(JSON.stringify(expected))
      })
    })

    it('should handle mixed types in combinations', () => {
      const args = [
        ['text1', 'text2'],
        [0.1, 0.9],
        [100, 500],
        [true, false]
      ]
      const result = combineArgs(args)
      expect(result).toHaveLength(16) // 2^4
      expect(result[0]).toEqual(['text1', 0.1, 100, true])
      expect(result[result.length - 1]).toEqual(['text2', 0.9, 500, false])
    })

    it('should handle complex object variants', () => {
      const args = [{
        model: ['gpt-4', 'claude'],
        temperature: [0.1, 0.5, 0.9],
        max_tokens: [100, 1000]
      }]
      const result = combineArgs(args)
      expect(result).toHaveLength(12) // 2 * 3 * 2
      
      // Check first and last combinations
      expect(result[0]).toEqual([{ model: 'gpt-4', temperature: 0.1, max_tokens: 100 }])
      expect(result[result.length - 1]).toEqual([{ model: 'claude', temperature: 0.9, max_tokens: 1000 }])
    })
  })
})