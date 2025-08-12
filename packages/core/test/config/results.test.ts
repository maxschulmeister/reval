import { describe, it, expect } from 'vitest'

describe('Result transformation (run.result)', () => {
  describe('Basic result mapping', () => {
    it('should extract required prediction property', () => {
      const mockFunctionResult = {
        response: "This is the AI response",
        usage: { prompt_tokens: 10, completion_tokens: 20 },
        model: "gpt-4"
      }

      const resultFunction = (result: typeof mockFunctionResult) => ({
        prediction: result.response,
        tokens: {
          in: result.usage.prompt_tokens,
          out: result.usage.completion_tokens
        }
      })

      const transformedResult = resultFunction(mockFunctionResult)
      
      expect(transformedResult).toHaveProperty('prediction')
      expect(transformedResult).toHaveProperty('tokens')
      expect(transformedResult.prediction).toBe("This is the AI response")
      expect(transformedResult.tokens.in).toBe(10)
      expect(transformedResult.tokens.out).toBe(20)
    })

    it('should extract required tokens.in and tokens.out properties', () => {
      const mockResult = {
        choices: [{ message: { content: "AI generated text" } }],
        usage: { prompt_tokens: 25, completion_tokens: 50 }
      }

      const resultFunction = (result: typeof mockResult) => ({
        prediction: result.choices[0].message.content,
        tokens: {
          in: result.usage.prompt_tokens,
          out: result.usage.completion_tokens
        }
      })

      const transformedResult = resultFunction(mockResult)
      
      expect(transformedResult.tokens).toHaveProperty('in')
      expect(transformedResult.tokens).toHaveProperty('out')
      expect(typeof transformedResult.tokens.in).toBe('number')
      expect(typeof transformedResult.tokens.out).toBe('number')
      expect(transformedResult.tokens.in).toBe(25)
      expect(transformedResult.tokens.out).toBe(50)
    })

    it('should handle additional optional metrics', () => {
      const mockResult = {
        text: "Generated content",
        tokens_used: { input: 15, output: 30 },
        metadata: { confidence: 0.95, model_version: "v1.0" },
        processing_time: 1200
      }

      const resultFunction = (result: typeof mockResult) => ({
        prediction: result.text,
        tokens: {
          in: result.tokens_used.input,
          out: result.tokens_used.output
        },
        confidence: result.metadata.confidence,
        model_version: result.metadata.model_version,
        processing_time_ms: result.processing_time,
        total_tokens: result.tokens_used.input + result.tokens_used.output
      })

      const transformedResult = resultFunction(mockResult)
      
      expect(transformedResult.prediction).toBe("Generated content")
      expect(transformedResult.tokens.in).toBe(15)
      expect(transformedResult.tokens.out).toBe(30)
      expect(transformedResult.confidence).toBe(0.95)
      expect(transformedResult.model_version).toBe("v1.0")
      expect(transformedResult.processing_time_ms).toBe(1200)
      expect(transformedResult.total_tokens).toBe(45)
    })
  })

  describe('Different result structures', () => {
    it('should handle OpenAI-style responses', () => {
      const openAIResult = {
        choices: [
          {
            message: { content: "OpenAI response", role: "assistant" },
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 35,
          total_tokens: 55
        },
        model: "gpt-4",
        created: 1234567890
      }

      const openAIResultFunction = (result: typeof openAIResult) => ({
        prediction: result.choices[0].message.content,
        tokens: {
          in: result.usage.prompt_tokens,
          out: result.usage.completion_tokens
        },
        model: result.model,
        finish_reason: result.choices[0].finish_reason,
        total_tokens: result.usage.total_tokens
      })

      const transformedResult = openAIResultFunction(openAIResult)
      expect(transformedResult.prediction).toBe("OpenAI response")
      expect(transformedResult.tokens.in).toBe(20)
      expect(transformedResult.tokens.out).toBe(35)
      expect(transformedResult.model).toBe("gpt-4")
      expect(transformedResult.finish_reason).toBe("stop")
      expect(transformedResult.total_tokens).toBe(55)
    })

    it('should handle Anthropic Claude-style responses', () => {
      const claudeResult = {
        content: [
          { type: "text", text: "Claude response" }
        ],
        usage: {
          input_tokens: 18,
          output_tokens: 42
        },
        model: "claude-3-sonnet",
        stop_reason: "end_turn"
      }

      const claudeResultFunction = (result: typeof claudeResult) => ({
        prediction: result.content[0].text,
        tokens: {
          in: result.usage.input_tokens,
          out: result.usage.output_tokens
        },
        model: result.model,
        stop_reason: result.stop_reason
      })

      const transformedResult = claudeResultFunction(claudeResult)
      expect(transformedResult.prediction).toBe("Claude response")
      expect(transformedResult.tokens.in).toBe(18)
      expect(transformedResult.tokens.out).toBe(42)
      expect(transformedResult.model).toBe("claude-3-sonnet")
      expect(transformedResult.stop_reason).toBe("end_turn")
    })

    it('should handle custom API responses', () => {
      const customResult = {
        result: "Custom AI output",
        token_count: { prompt: 12, response: 28 },
        score: 0.87,
        metadata: {
          processing_time: 850,
          model_name: "custom-llm-v2",
          temperature: 0.7
        }
      }

      const customResultFunction = (result: typeof customResult) => ({
        prediction: result.result,
        tokens: {
          in: result.token_count.prompt,
          out: result.token_count.response
        },
        score: result.score,
        processing_time: result.metadata.processing_time,
        model_name: result.metadata.model_name,
        temperature: result.metadata.temperature
      })

      const transformedResult = customResultFunction(customResult)
      expect(transformedResult.prediction).toBe("Custom AI output")
      expect(transformedResult.tokens.in).toBe(12)
      expect(transformedResult.tokens.out).toBe(28)
      expect(transformedResult.score).toBe(0.87)
      expect(transformedResult.processing_time).toBe(850)
      expect(transformedResult.model_name).toBe("custom-llm-v2")
      expect(transformedResult.temperature).toBe(0.7)
    })
  })

  describe('Result function edge cases', () => {
    it('should handle missing prediction property', () => {
      const resultWithoutPrediction = {
        usage: { prompt_tokens: 10, completion_tokens: 20 },
        model: "test-model"
      }

      const resultFunction = (result: typeof resultWithoutPrediction) => ({
        prediction: "", // Default empty string when no prediction available
        tokens: {
          in: result.usage.prompt_tokens,
          out: result.usage.completion_tokens
        },
        model: result.model
      })

      const transformedResult = resultFunction(resultWithoutPrediction)
      expect(transformedResult.prediction).toBe("")
      expect(transformedResult.tokens.in).toBe(10)
      expect(transformedResult.tokens.out).toBe(20)
    })

    it('should handle missing tokens properties', () => {
      const resultWithoutTokens = {
        response: "Some response",
        model: "test-model"
      }

      const resultFunction = (result: typeof resultWithoutTokens) => ({
        prediction: result.response,
        tokens: {
          in: 0, // Default to 0 when no token info available
          out: 0
        },
        model: result.model
      })

      const transformedResult = resultFunction(resultWithoutTokens)
      expect(transformedResult.prediction).toBe("Some response")
      expect(transformedResult.tokens.in).toBe(0)
      expect(transformedResult.tokens.out).toBe(0)
      expect(transformedResult.model).toBe("test-model")
    })

    it('should handle invalid token values (non-numbers)', () => {
      const resultWithInvalidTokens = {
        response: "Response text",
        usage: { prompt_tokens: "invalid", completion_tokens: null }
      }

      const resultFunction = (result: typeof resultWithInvalidTokens) => ({
        prediction: result.response,
        tokens: {
          in: typeof result.usage.prompt_tokens === 'number' ? result.usage.prompt_tokens : 0,
          out: typeof result.usage.completion_tokens === 'number' ? result.usage.completion_tokens : 0
        }
      })

      const transformedResult = resultFunction(resultWithInvalidTokens)
      expect(transformedResult.prediction).toBe("Response text")
      expect(transformedResult.tokens.in).toBe(0) // Converted invalid string to 0
      expect(transformedResult.tokens.out).toBe(0) // Converted null to 0
    })

    it('should handle result function throwing errors', () => {
      const validResult = {
        response: "valid response",
        usage: { prompt_tokens: 10, completion_tokens: 20 }
      }

      const errorResultFunction = (result: typeof validResult) => {
        if (result.response === "trigger_error") {
          throw new Error("Result transformation failed")
        }
        return {
          prediction: result.response,
          tokens: {
            in: result.usage.prompt_tokens,
            out: result.usage.completion_tokens
          }
        }
      }

      // Should work with valid input
      const validTransform = errorResultFunction(validResult)
      expect(validTransform.prediction).toBe("valid response")

      // Should throw with trigger input
      const errorResult = { ...validResult, response: "trigger_error" }
      expect(() => errorResultFunction(errorResult)).toThrow("Result transformation failed")
    })

    it('should handle null/undefined input to result function', () => {
      const defensiveResultFunction = (result: any) => {
        if (!result) {
          return {
            prediction: "No result available",
            tokens: { in: 0, out: 0 }
          }
        }

        return {
          prediction: result.response || result.text || "No prediction",
          tokens: {
            in: result.usage?.prompt_tokens || result.tokens?.in || 0,
            out: result.usage?.completion_tokens || result.tokens?.out || 0
          }
        }
      }

      // Test with null
      const nullResult = defensiveResultFunction(null)
      expect(nullResult.prediction).toBe("No result available")
      expect(nullResult.tokens.in).toBe(0)
      expect(nullResult.tokens.out).toBe(0)

      // Test with undefined
      const undefinedResult = defensiveResultFunction(undefined)
      expect(undefinedResult.prediction).toBe("No result available")
      expect(undefinedResult.tokens.in).toBe(0)
      expect(undefinedResult.tokens.out).toBe(0)

      // Test with valid result
      const validResult = { response: "valid", usage: { prompt_tokens: 5, completion_tokens: 10 } }
      const validTransform = defensiveResultFunction(validResult)
      expect(validTransform.prediction).toBe("valid")
      expect(validTransform.tokens.in).toBe(5)
      expect(validTransform.tokens.out).toBe(10)
    })
  })

  describe('Complex result transformations', () => {
    it('should handle nested result structures', () => {
      const complexResult = {
        response: {
          content: {
            text: "Nested response text",
            metadata: { confidence: 0.92 }
          },
          usage: {
            tokens: { input: 25, output: 45 },
            cost: 0.002
          }
        },
        model_info: {
          name: "advanced-model",
          version: "2.1"
        }
      }

      const complexResultFunction = (result: typeof complexResult) => ({
        prediction: result.response.content.text,
        tokens: {
          in: result.response.usage.tokens.input,
          out: result.response.usage.tokens.output
        },
        confidence: result.response.content.metadata.confidence,
        cost: result.response.usage.cost,
        model_name: result.model_info.name,
        model_version: result.model_info.version
      })

      const transformedResult = complexResultFunction(complexResult)
      expect(transformedResult.prediction).toBe("Nested response text")
      expect(transformedResult.tokens.in).toBe(25)
      expect(transformedResult.tokens.out).toBe(45)
      expect(transformedResult.confidence).toBe(0.92)
      expect(transformedResult.cost).toBe(0.002)
      expect(transformedResult.model_name).toBe("advanced-model")
      expect(transformedResult.model_version).toBe("2.1")
    })

    it('should handle array-based results', () => {
      const arrayResult = {
        predictions: [
          { text: "First prediction", score: 0.95 },
          { text: "Second prediction", score: 0.87 },
          { text: "Third prediction", score: 0.73 }
        ],
        usage: { input_tokens: 30, output_tokens: 60 },
        best_prediction_index: 0
      }

      const arrayResultFunction = (result: typeof arrayResult) => ({
        prediction: result.predictions[result.best_prediction_index].text,
        tokens: {
          in: result.usage.input_tokens,
          out: result.usage.output_tokens
        },
        best_score: result.predictions[result.best_prediction_index].score,
        all_predictions: result.predictions.map(p => p.text),
        all_scores: result.predictions.map(p => p.score)
      })

      const transformedResult = arrayResultFunction(arrayResult)
      expect(transformedResult.prediction).toBe("First prediction")
      expect(transformedResult.tokens.in).toBe(30)
      expect(transformedResult.tokens.out).toBe(60)
      expect(transformedResult.best_score).toBe(0.95)
      expect(transformedResult.all_predictions).toEqual([
        "First prediction", "Second prediction", "Third prediction"
      ])
      expect(transformedResult.all_scores).toEqual([0.95, 0.87, 0.73])
    })

    it('should handle result with computed metrics', () => {
      const metricsResult = {
        content: "Processed text output",
        timing: { start: 1000, end: 2500 },
        resources: { input_tokens: 40, output_tokens: 80 },
        quality_scores: { fluency: 0.9, relevance: 0.85, accuracy: 0.92 }
      }

      const metricsResultFunction = (result: typeof metricsResult) => {
        const processingTime = result.timing.end - result.timing.start
        const avgQualityScore = (
          result.quality_scores.fluency + 
          result.quality_scores.relevance + 
          result.quality_scores.accuracy
        ) / 3

        return {
          prediction: result.content,
          tokens: {
            in: result.resources.input_tokens,
            out: result.resources.output_tokens
          },
          processing_time_ms: processingTime,
          avg_quality_score: Number(avgQualityScore.toFixed(3)),
          tokens_per_second: Number((result.resources.output_tokens / (processingTime / 1000)).toFixed(2)),
          quality_breakdown: result.quality_scores
        }
      }

      const transformedResult = metricsResultFunction(metricsResult)
      expect(transformedResult.prediction).toBe("Processed text output")
      expect(transformedResult.tokens.in).toBe(40)
      expect(transformedResult.tokens.out).toBe(80)
      expect(transformedResult.processing_time_ms).toBe(1500)
      expect(transformedResult.avg_quality_score).toBe(0.89)
      expect(transformedResult.tokens_per_second).toBe(53.33) // 80 tokens / 1.5 seconds
      expect(transformedResult.quality_breakdown).toEqual({
        fluency: 0.9, relevance: 0.85, accuracy: 0.92
      })
    })
  })
})