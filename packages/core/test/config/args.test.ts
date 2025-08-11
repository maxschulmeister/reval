import { describe, it, expect } from 'vitest'
import type { ArgsContext } from '../../src/types/config'

describe('Args mapping (run.args)', () => {
  describe('Basic args function with context', () => {
    it('should call args function with context containing features, target, variants', () => {
      const mockContext: ArgsContext = {
        features: ['input1', 'input2', 'input3'],
        target: ['output1', 'output2', 'output3'],
        variants: {
          model: ['gpt-4', 'claude'],
          temperature: [0.1, 0.7, 0.9]
        },
        trim: 10
      }

      const argsFunction = (context: ArgsContext) => {
        expect(context.features).toEqual(['input1', 'input2', 'input3'])
        expect(context.target).toEqual(['output1', 'output2', 'output3'])
        expect(context.variants).toEqual({
          model: ['gpt-4', 'claude'],
          temperature: [0.1, 0.7, 0.9]
        })
        expect(context.trim).toBe(10)
        
        return [context.features[0], context.variants.model[0]]
      }

      const result = argsFunction(mockContext)
      expect(result).toEqual(['input1', 'gpt-4'])
    })

    it('should return correct array shape and parameter order', () => {
      const mockContext: ArgsContext = {
        features: [{ text: 'hello world' }],
        target: ['positive'],
        variants: {
          model: ['gpt-4'],
          temperature: [0.5]
        }
      }

      const argsFunction = (context: ArgsContext) => [
        context.features[0].text,
        context.variants.model[0],
        context.variants.temperature[0]
      ]

      const result = argsFunction(mockContext)
      expect(result).toEqual(['hello world', 'gpt-4', 0.5])
      expect(result).toHaveLength(3)
      expect(typeof result[0]).toBe('string')
      expect(typeof result[1]).toBe('string')
      expect(typeof result[2]).toBe('number')
    })
  })

  describe('Args function accessing nested context', () => {
    it('should access context.features with object structures', () => {
      const mockContext: ArgsContext = {
        features: [
          { input: 'text1', metadata: { length: 5 } },
          { input: 'text2', metadata: { length: 10 } }
        ],
        target: ['result1', 'result2'],
        variants: {
          model: ['gpt-4', 'claude']
        }
      }

      const argsFunction = (context: ArgsContext) => [
        {
          text: context.features[0].input,
          length: context.features[0].metadata.length,
          model: context.variants.model[0]
        }
      ]

      const result = argsFunction(mockContext)
      expect(result).toEqual([{
        text: 'text1',
        length: 5,
        model: 'gpt-4'
      }])
    })

    it('should access context.variants with multiple variant types', () => {
      const mockContext: ArgsContext = {
        features: ['input_text'],
        target: ['expected_output'],
        variants: {
          model: ['gpt-4', 'claude', 'gemini'],
          temperature: [0.1, 0.5, 0.9],
          max_tokens: [100, 500, 1000],
          system_prompt: ['default', 'detailed', 'concise']
        }
      }

      const argsFunction = (context: ArgsContext) => [
        context.features[0],
        {
          model: context.variants.model[1], // claude
          temperature: context.variants.temperature[2], // 0.9
          max_tokens: context.variants.max_tokens[0], // 100
          system_prompt: context.variants.system_prompt[2] // concise
        }
      ]

      const result = argsFunction(mockContext)
      expect(result).toEqual([
        'input_text',
        {
          model: 'claude',
          temperature: 0.9,
          max_tokens: 100,
          system_prompt: 'concise'
        }
      ])
    })

    it('should handle complex object features with variant combinations', () => {
      const mockContext: ArgsContext = {
        features: {
          documents: ['doc1.pdf', 'doc2.pdf'],
          prompts: ['summarize this', 'extract key points']
        } as any, // Using any to allow object structure for features
        target: ['summary1', 'summary2'],
        variants: {
          ocr_model: ['tesseract', 'aws-textract'],
          llm_model: ['gpt-4', 'claude'],
          quality: ['fast', 'accurate']
        }
      }

      const argsFunction = (context: ArgsContext) => [
        {
          file: (context.features as any).documents[0],
          prompt: (context.features as any).prompts[0],
          ocrModel: context.variants.ocr_model[1], // aws-textract
          extractModel: context.variants.llm_model[0], // gpt-4
          quality: context.variants.quality[1] // accurate
        }
      ]

      const result = argsFunction(mockContext)
      expect(result).toEqual([{
        file: 'doc1.pdf',
        prompt: 'summarize this',
        ocrModel: 'aws-textract',
        extractModel: 'gpt-4',
        quality: 'accurate'
      }])
    })
  })

  describe('Args function edge cases', () => {
    it('should handle args function returning empty array', () => {
      const mockContext: ArgsContext = {
        features: ['input'],
        target: ['output'],
        variants: { model: ['gpt-4'] }
      }

      const argsFunction = (_context: ArgsContext) => []

      const result = argsFunction(mockContext)
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should handle args function with single parameter', () => {
      const mockContext: ArgsContext = {
        features: ['single input'],
        target: ['single output'],
        variants: { model: ['gpt-4'] }
      }

      const argsFunction = (context: ArgsContext) => [context.features[0]]

      const result = argsFunction(mockContext)
      expect(result).toEqual(['single input'])
      expect(result).toHaveLength(1)
    })

    it('should handle args function that throws errors', () => {
      const mockContext: ArgsContext = {
        features: ['input'],
        target: ['output'],
        variants: { model: ['invalid'] }
      }

      const errorArgsFunction = (context: ArgsContext) => {
        if (context.variants.model[0] === 'invalid') {
          throw new Error('Invalid model specified')
        }
        return [context.features[0]]
      }

      expect(() => errorArgsFunction(mockContext)).toThrow('Invalid model specified')
    })

    it('should handle args function with invalid return type', () => {
      const mockContext: ArgsContext = {
        features: ['input'],
        target: ['output'],
        variants: { model: ['gpt-4'] }
      }

      const invalidArgsFunction = (_context: ArgsContext) => {
        // TypeScript would catch this, but testing runtime behavior
        return "not an array" as any
      }

      const result = invalidArgsFunction(mockContext)
      expect(typeof result).toBe('string')
      expect(result).toBe('not an array')
      // This would cause issues in actual execution, but the function itself runs
    })

    it('should handle context with missing properties gracefully', () => {
      // Simulate partial context (this would be caught by TypeScript in real usage)
      const incompleteContext = {
        features: ['input'],
        target: ['output']
        // missing variants
      } as ArgsContext

      const defensiveArgsFunction = (context: ArgsContext) => {
        const model = context.variants?.model?.[0] || 'default-model'
        return [context.features[0], model]
      }

      const result = defensiveArgsFunction(incompleteContext)
      expect(result).toEqual(['input', 'default-model'])
    })
  })

  describe('Real-world args function patterns', () => {
    it('should demonstrate file processing pattern', () => {
      const mockContext: ArgsContext = {
        features: [
          { filename: 'invoice.pdf', content: 'base64data...' },
          { filename: 'receipt.jpg', content: 'base64data...' }
        ],
        target: ['extracted_text_1', 'extracted_text_2'],
        variants: {
          ocr_engine: ['tesseract', 'google-vision'],
          language: ['en', 'es', 'fr'],
          confidence_threshold: [0.7, 0.8, 0.9]
        }
      }

      const fileProcessingArgs = (context: ArgsContext) => [
        {
          file: context.features[0],
          config: {
            ocrEngine: context.variants.ocr_engine[0],
            language: context.variants.language[0],
            confidenceThreshold: context.variants.confidence_threshold[1]
          }
        }
      ]

      const result = fileProcessingArgs(mockContext)
      expect(result[0].file.filename).toBe('invoice.pdf')
      expect(result[0].config.ocrEngine).toBe('tesseract')
      expect(result[0].config.language).toBe('en')
      expect(result[0].config.confidenceThreshold).toBe(0.8)
    })

    it('should demonstrate LLM API pattern', () => {
      const mockContext: ArgsContext = {
        features: ['Analyze this document for key insights'],
        target: ['Key insights: revenue increased by 15%...'],
        variants: {
          model: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
          temperature: [0.1, 0.3, 0.7],
          max_tokens: [500, 1000, 2000],
          system_prompt: ['You are an analyst', 'You are a summarizer']
        }
      }

      const llmApiArgs = (context: ArgsContext) => [
        context.features[0], // user message
        {
          model: context.variants.model[2], // claude-3
          temperature: context.variants.temperature[0], // 0.1
          max_tokens: context.variants.max_tokens[1], // 1000
          system: context.variants.system_prompt[0] // analyst
        }
      ]

      const result = llmApiArgs(mockContext)
      expect(result[0]).toBe('Analyze this document for key insights')
      expect(result[1].model).toBe('claude-3')
      expect(result[1].temperature).toBe(0.1)
      expect(result[1].max_tokens).toBe(1000)
      expect(result[1].system).toBe('You are an analyst')
    })

    it('should demonstrate batch processing pattern', () => {
      const mockContext: ArgsContext = {
        features: [
          ['item1', 'item2', 'item3'],
          ['item4', 'item5', 'item6']
        ],
        target: [['result1', 'result2', 'result3'], ['result4', 'result5', 'result6']],
        variants: {
          batch_size: [1, 3, 5],
          parallel: [true, false],
          timeout: [30, 60, 120]
        }
      }

      const batchProcessingArgs = (context: ArgsContext) => [
        context.features[0], // first batch
        {
          batchSize: context.variants.batch_size[1], // 3
          parallel: context.variants.parallel[0], // true
          timeout: context.variants.timeout[2] // 120
        }
      ]

      const result = batchProcessingArgs(mockContext)
      expect(result[0]).toEqual(['item1', 'item2', 'item3'])
      expect(result[1].batchSize).toBe(3)
      expect(result[1].parallel).toBe(true)
      expect(result[1].timeout).toBe(120)
    })
  })
})