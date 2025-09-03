'use client';
import { cn } from '@/app/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export type ThemeSwitcherProps = {
  className?: string;
};

export const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';
  const Icon = isDark ? Moon : Sun;
  const label = `Switch to ${isDark ? 'light' : 'dark'} theme`;

  return (
    <button
      aria-label={label}
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
