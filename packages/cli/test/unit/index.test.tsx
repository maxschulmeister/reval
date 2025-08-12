import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import Index from '../../src/commands/index';

describe('Index (Help) Command', () => {
  it('renders main help screen with commands list', () => {
    const { lastFrame } = render(<Index options={{}} />);
    const output = lastFrame();
    
    expect(output).toContain('🎯 reval CLI v0.1.0');
    expect(output).toContain('A benchmark framework for evaluating LLM applications');
    expect(output).toContain('Commands:');
    expect(output).toContain('run');
    expect(output).toContain('list');
    expect(output).toContain('show');
    expect(output).toContain('export');
    expect(output).toContain('init');
    expect(output).toContain('ui');
    expect(output).toContain('version');
    expect(output).toContain('Database Commands:');
    expect(output).toContain('db create');
    expect(output).toContain('db migrate');
    expect(output).toContain('db studio');
    expect(output).toContain('Quick Start:');
  });

  it('renders version when --version flag is provided', () => {
    const { lastFrame } = render(<Index options={{ version: true }} />);
    
    expect(lastFrame()).toBe('reval CLI v0.1.0');
  });

  it('help screen matches snapshot', () => {
    const { lastFrame } = render(<Index options={{}} />);
    
    expect(lastFrame()).toMatchSnapshot();
  });
});