import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import Version from '../../src/commands/version';

describe('Version Command', () => {
  it('renders version information correctly', () => {
    const { lastFrame } = render(<Version />);
    
    expect(lastFrame()).toContain('reval CLI v0.1.0');
    expect(lastFrame()).toContain('core v0.1.0');
  });

  it('matches snapshot', () => {
    const { lastFrame } = render(<Version />);
    
    expect(lastFrame()).toMatchSnapshot();
  });
});