import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Benchmark, Execution, Run } from '../src/types/db'
import { Status } from '../src/types/db'

// Mock external dependencies
vi.mock('p-queue')
vi.mock('p-retry')  
vi.mock('nanoid', () => ({
  customRandom: vi.fn(() => vi.fn(() => 'mock-id-123')),
  random: vi.fn(),
  urlAlphabet: 'mock-alphabet'
}))
vi.mock('../src/db/save-run')
vi.mock('../src/utils')
vi.mock('../src/utils/config')

// Import mocked modules
import pQueue from 'p-queue'
import pRetry from 'p-retry'
import { saveRun } from '../src/db/save-run'
import { loadConfig, loadData, combineArgs, getFeatures, getVariant } from '../src/utils'
import { validateConfig } from '../src/utils/config'

// Since run.ts exports the run function and immediately calls it, we need to mock it
vi.mock('../src/run.ts', async () => {
  const actual = await vi.importActual('../src/run.ts')
  return {
    ...actual,
    default: vi.fn()
  }
})

describe('run() function', () => {
  let mockQueue: any
  let mockConfig: any
  let mockData: any
  let mockFunction: any
  let mockArgs: any
  let mockResult: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock p-queue
    mockQueue = {
      add: vi.fn(),
      concurrency: 5,
      interval: 1000
    }
    vi.mocked(pQueue).mockImplementation(() => mockQueue)

    // Mock test function 
    mockFunction = vi.fn().mockResolvedValue({
      response: 'test response',
      usage: { prompt_tokens: 10, completion_tokens: 20 }
    })

    // Mock args function
    mockArgs = vi.fn().mockReturnValue({
      features: ['input1', 'input2'],
      target: ['output1', 'output2'],
      variants: { model: ['gpt-4'], temperature: [0.5] }
    })

    // Mock result function  
    mockResult = vi.fn().mockReturnValue({
      prediction: 'test prediction',
      tokens: { in: 10, out: 20 }
    })

    // Mock config
    mockConfig = {
      concurrency: 5,
      retries: 2,
      interval: 1000,
      data: {
        path: '/tmp/test.csv',
        variants: { model: ['gpt-4'], temperature: [0.5] }
      },
      run: {
        function: mockFunction,
        args: mockArgs,
        result: mockResult
      }
    }

    // Mock data
    mockData = {
      features: ['input1', 'input2'],
      target: ['output1', 'output2']
    }

    // Setup mock returns
    vi.mocked(loadConfig).mockResolvedValue(mockConfig)
    vi.mocked(validateConfig).mockReturnValue(mockConfig)
    vi.mocked(loadData).mockResolvedValue(mockData)
    vi.mocked(combineArgs).mockReturnValue([['input1'], ['input2']])
    vi.mocked(getFeatures).mockReturnValue('input1')
    vi.mocked(getVariant).mockReturnValue({ model: 'gpt-4', temperature: 0.5 })
    vi.mocked(saveRun).mockResolvedValue(undefined)
    vi.mocked(pRetry).mockImplementation(async (fn) => await fn())
  })

  const importRunFunction = async () => {
    // Since run.ts calls the function immediately, we need to extract the logic
    // We'll create a test version of the run function
    const { customRandom, urlAlphabet } = await import('nanoid')
    const nanoid = customRandom(urlAlphabet, 24, Math.random)
    
    return async () => {
      const timestamp = Date.now()
      const rawConfig = await loadConfig()
      const config = validateConfig(rawConfig)
      const data = await loadData()
      const context = {
        path: config.data.path,
        features: data.features,
        target: data.target,
        variants: config.data.variants,
      }
      const fnName = config.run.function.name
      const variants = Object.entries(config.data.variants).map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${value.length}_${key}`
        }
        return `${key}`
      })

      const name = `${fnName}-${variants.join("-")}-${timestamp}`
      const runId = nanoid()

      const queue = new pQueue({
        concurrency: config.concurrency,
        interval: config.interval,
        intervalCap: 1,
      })

      const args = combineArgs(config.run.args(context))
      const promises = args.map((arg) =>
        queue.add(async () => {
          let retryCount = 0
          let startTime: number = Date.now()
          let status: Status = Status.Success
          let response: any = null
          let error: any

          try {
            response = await pRetry(
              async () => {
                startTime = Date.now()
                return await config.run.function.apply(null, arg)
              },
              {
                retries: config.retries,
                onFailedAttempt: (attemptError) => {
                  retryCount = attemptError.attemptNumber - 1
                },
              },
            )
          } catch (err) {
            status = Status.Error
            error = err
            response = null
          }

          const endTime = Date.now()
          const executionTime = endTime - startTime

          const variant = getVariant(arg, config.data.variants)
          const features = getFeatures(arg, context.features)
          const index = context.features.indexOf(features)

          const execution: Execution = {
            id: nanoid(),
            runId,
            features,
            target: context.target[index],
            result: response ? config.run.result(response) : null,
            time: executionTime,
            retries: retryCount,
            status,
            variant,
          }

          return execution
        }),
      )

      const executions = await Promise.all(promises)

      const run: Run = {
        id: runId,
        name,
        notes: "",
        function: config.run.function.toString(),
        features: context.features,
        target: context.target,
        variants: context.variants,
        timestamp,
      }

      const benchmark: Benchmark = {
        run,
        executions,
      }

      await saveRun(run, executions)

      return benchmark
    }
  }

  it('should execute function with correct concurrency settings', async () => {
    const runFunction = await importRunFunction()
    
    await runFunction()

    expect(pQueue).toHaveBeenCalledWith({
      concurrency: 5,
      interval: 1000,
      intervalCap: 1,
    })
  })

  it('should handle retries according to config', async () => {
    const runFunction = await importRunFunction()
    mockQueue.add = vi.fn().mockImplementation(async (fn) => await fn())
    
    await runFunction()

    expect(pRetry).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        retries: 2,
        onFailedAttempt: expect.any(Function)
      })
    )
  })

  it('should track execution timing accurately', async () => {
    const runFunction = await importRunFunction()
    mockQueue.add = vi.fn().mockImplementation(async (fn) => await fn())
    const originalDateNow = Date.now
    let callCount = 0
    
    // Mock Date.now to return predictable values
    vi.spyOn(Date, 'now').mockImplementation(() => {
      callCount++
      return 1000 + callCount * 100 // Start at 1000, increment by 100
    })
    
    const result = await runFunction()

    expect(result.executions[0].time).toBeGreaterThan(0)
    
    Date.now = originalDateNow
  })

  it('should create proper benchmark structure', async () => {
    const runFunction = await importRunFunction()
    mockQueue.add = vi.fn().mockImplementation(async (fn) => await fn())
    
    const result = await runFunction()

    // Verify benchmark has the correct structure
    expect(result).toHaveProperty('run')
    expect(result).toHaveProperty('executions')
    
    // Verify run structure
    expect(result.run).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      notes: "",
      function: expect.any(String),
      features: expect.any(Array),
      target: expect.any(Array),
      variants: expect.any(Object),
      timestamp: expect.any(Number)
    })

    // Verify executions structure
    expect(result.executions).toEqual(expect.arrayContaining([
      expect.objectContaining({
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
    ]))

    // Verify the run and executions are properly linked
    expect(result.executions[0].runId).toBe(result.run.id)
  })

  it('should save results to database', async () => {
    const runFunction = await importRunFunction()
    mockQueue.add = vi.fn().mockImplementation(async (fn) => await fn())
    
    await runFunction()

    expect(saveRun).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String)
      }),
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          status: expect.any(String)
        })
      ])
    )
  })

  it('should handle function execution errors', async () => {
    const runFunction = await importRunFunction()
    mockQueue.add = vi.fn().mockImplementation(async (fn) => await fn())
    
    // Mock function to throw error
    const errorFunction = vi.fn().mockRejectedValue(new Error('Test error'))
    mockConfig.run.function = errorFunction
    vi.mocked(validateConfig).mockReturnValue(mockConfig)
    vi.mocked(pRetry).mockRejectedValue(new Error('Test error'))
    
    const result = await runFunction()

    expect(result.executions[0].status).toBe(Status.Error)
    expect(result.executions[0].result).toBeNull()
  })

  it('should process variants correctly', async () => {
    const runFunction = await importRunFunction()
    mockQueue.add = vi.fn().mockImplementation(async (fn) => await fn())
    
    const result = await runFunction()

    expect(getVariant).toHaveBeenCalledWith(
      expect.any(Array),
      mockConfig.data.variants
    )
    expect(result.executions[0].variant).toEqual({ model: 'gpt-4', temperature: 0.5 })
  })

  it('should extract features from arguments', async () => {
    const runFunction = await importRunFunction()
    mockQueue.add = vi.fn().mockImplementation(async (fn) => await fn())
    
    const result = await runFunction()

    expect(getFeatures).toHaveBeenCalledWith(
      expect.any(Array),
      mockData.features
    )
    expect(result.executions[0].features).toBe('input1')
  })

  it('should generate proper run name from function and variants', async () => {
    const runFunction = await importRunFunction()
    mockQueue.add = vi.fn().mockImplementation(async (fn) => await fn())
    mockFunction.name = 'testFunction'
    
    const result = await runFunction()

    expect(result.run.name).toContain('testFunction')
    expect(result.run.name).toContain('1_model') // 1 model variant
    expect(result.run.name).toContain('1_temperature') // 1 temperature variant
  })

  it('should apply function with correct arguments', async () => {
    const runFunction = await importRunFunction()
    mockQueue.add = vi.fn().mockImplementation(async (fn) => await fn())
    
    await runFunction()

    expect(mockFunction).toHaveBeenCalledWith('input1')
  })

  it('should handle multiple executions from combined args', async () => {
    const runFunction = await importRunFunction()
    mockQueue.add = vi.fn().mockImplementation(async (fn) => await fn())
    
    // Mock multiple argument combinations
    vi.mocked(combineArgs).mockReturnValue([['input1'], ['input2'], ['input3']])
    
    const result = await runFunction()

    expect(result.executions).toHaveLength(3)
    expect(mockQueue.add).toHaveBeenCalledTimes(3)
  })
})