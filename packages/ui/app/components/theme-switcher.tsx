'use client';
import { cn } from '@/app/lib/utils';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';

export type ThemeSwitcherProps = {
  value?: 'light' | 'dark';
  onChange?: (theme: 'light' | 'dark') => void;
  className?: string;
};

export const ThemeSwitcher = ({
  value,
  onChange,
  className,
}: ThemeSwitcherProps) => {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme and set as default if no defaultValue provided
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);

    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  const [theme, setTheme] = useControllableState({
    defaultProp: systemTheme,
    prop: value,
    onChange,
  });
  const [mounted, setMounted] = useState(false);

  const handleToggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Determine which icon to show
  const getIcon = () => {
    return theme === 'dark' ? Moon : Sun;
  };

  const getLabel = () => {
    return `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
  };

  const Icon = getIcon();

  return (
    <button
      aria-label={getLabel()}
      className={cn(
        'relative h-8 w-8 rounded-radius bg-background ring-1 ring-border hover:bg-secondary/50 transition-colors',
        className
      )}
      onClick={handleToggle}
      type="button"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.2, bounce: 0.1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Icon className="h-4 w-4 text-foreground" />
        </motion.div>
      </AnimatePresence>
    </button>
  );
};
