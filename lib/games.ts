/**
 * The trading-card games the store sells. Single source of truth for
 * validation (API) and the filter pills (admin + storefront).
 *
 * Stored on Product.game as one of these slugs. Adding a game = add it here.
 */
export const GAMES = ['pokemon', 'one-piece', 'lorcana', 'riftbound'] as const
export type Game = (typeof GAMES)[number]

export const GAME_LABELS: Record<Game, string> = {
  'pokemon': 'Pokémon',
  'one-piece': 'One Piece',
  'lorcana': 'Lorcana',
  'riftbound': 'Riftbound',
}

export function isGame(v: unknown): v is Game {
  return typeof v === 'string' && (GAMES as readonly string[]).includes(v)
}

/** Coerce any input to a valid game slug, defaulting to pokemon. */
export function normalizeGame(v: unknown): Game {
  return isGame(v) ? v : 'pokemon'
}
