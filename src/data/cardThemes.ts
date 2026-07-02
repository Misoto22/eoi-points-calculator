// Share-card palettes — colors for the exported PNG live here, not in the drawing code.
export type CardTheme = 'cream' | 'charcoal';

export interface CardPalette {
  bg: string;
  ink: string;
  soft: string;
  muted: string;
  hair: string;
  hairSoft: string;
}

export const cardPalettes: Record<CardTheme, CardPalette> = {
  cream: {
    bg: '#F2EFE5',
    ink: '#2B2A24',
    soft: '#4A473D',
    muted: '#8D8776',
    hair: '#CFC9B6',
    hairSoft: '#E0DBC9',
  },
  charcoal: {
    bg: '#2B2A24',
    ink: '#F0EDE1',
    soft: '#CCC6B4',
    muted: '#9B9484',
    hair: '#4A473C',
    hairSoft: '#3E3B31',
  },
};
