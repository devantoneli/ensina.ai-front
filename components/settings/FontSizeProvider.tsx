'use client';

import { useEffect } from 'react';

type FontSizeOption = 'small' | 'normal' | 'large';

const FONT_SIZE_STORAGE_KEY = 'ensina_ai_font_size';
const CONFIG_PREFS_STORAGE_KEY = 'ensina_ai_config_preferences';
const APP_ANIMATIONS_ATTRIBUTE = 'data-animations';

const FONT_SIZE_MAP: Record<FontSizeOption, string> = {
  small: '15px',
  normal: '16px',
  large: '18px',
};

function isFontSizeOption(value: string): value is FontSizeOption {
  return value === 'small' || value === 'normal' || value === 'large';
}

function applyRootFontSize(option: FontSizeOption): void {
  document.documentElement.style.setProperty('--app-root-font-size', FONT_SIZE_MAP[option]);
}

function applyAnimationsPreference(enabled: boolean): void {
  document.documentElement.setAttribute(APP_ANIMATIONS_ATTRIBUTE, enabled ? 'on' : 'off');
}

function getInitialAnimationsEnabled(): boolean {
  try {
    const raw = window.localStorage.getItem(CONFIG_PREFS_STORAGE_KEY);
    if (!raw) return true;

    const parsed = JSON.parse(raw) as { appearanceAnimations?: boolean };
    return parsed.appearanceAnimations !== false;
  } catch {
    return true;
  }
}

export default function FontSizeProvider() {
  useEffect(() => {
    const stored = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (stored && isFontSizeOption(stored)) {
      applyRootFontSize(stored);
    } else {
      applyRootFontSize('normal');
    }

    applyAnimationsPreference(getInitialAnimationsEnabled());
  }, []);

  return null;
}
