import { createContext, useContext } from 'react';
import { PALETTES, type Palette } from './design';

export const ThemeContext = createContext<Palette>(PALETTES.sage);
export const useTheme = () => useContext(ThemeContext);
