/**
 * Utility to wait for an Ink component to complete its async operations.
 * Since ink-testing-library doesn't provide waitUntilExit, we use a timeout-based approach.
 */

/**
 * Wait for a component to complete its async operations by checking if its output changes.
 * @param lastFrame Function to get the current frame
 * @param timeout Maximum time to wait in milliseconds (default: 2000)
 * @param interval How often to check in milliseconds (default: 100)
 */
export async function waitForComponentCompletion(
  lastFrame: () => string,
  timeout: number = 2000,
  interval: number = 100,
): Promise<void> {
  const startTime = Date.now();
  let previousFrame = lastFrame();
  
  return new Promise((resolve) => {
    const checkFrame = () => {
      const currentFrame = lastFrame();
      const elapsed = Date.now() - startTime;
      
      // If frame has changed from loading state, wait a bit more to ensure completion
      if (currentFrame !== previousFrame && !currentFrame.includes('...')) {
        // Give it one more interval to ensure it's really done
        setTimeout(resolve, interval);
        return;
      }
      
      if (elapsed >= timeout) {
        // Timeout reached, resolve anyway
        resolve();
        return;
      }
      
      previousFrame = currentFrame;
      setTimeout(checkFrame, interval);
    };
    
    checkFrame();
  });
}

/**
 * Simple timeout-based wait for async operations.
 */
export function waitForAsync(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}