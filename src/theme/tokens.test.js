import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { darkTokens, lightTokens, ops, rawTokens, tokenCssVars, tokens, tokensForMode, tokenVarName } from './tokens'

describe('token maps', () => {
  it('define exactly the same keys in light and dark', () => {
    expect(Object.keys(darkTokens).sort()).toEqual(Object.keys(lightTokens).sort())
  })

  it('keep `ops` as an alias of `tokens`', () => {
    expect(ops).toBe(tokens)
  })

  it('give every status family a background, foreground and border', () => {
    ;['success', 'warning', 'danger', 'info', 'neutral'].forEach(family => {
      ;['Bg', 'Fg', 'Border'].forEach(part => {
        expect(lightTokens[`${family}${part}`], `${family}${part} (light)`).toBeTruthy()
        expect(darkTokens[`${family}${part}`], `${family}${part} (dark)`).toBeTruthy()
      })
    })
  })

  it('differs between modes for the surfaces that must follow the theme', () => {
    ;['ink', 'canvas', 'canvasSoft', 'hairline', 'pageTint', 'shadowCard'].forEach(key => {
      expect(darkTokens[key], key).not.toBe(lightTokens[key])
    })
  })
})

describe('tokens (component-facing)', () => {
  it('are var() references with the light value as fallback', () => {
    expect(tokens.ink).toBe('var(--nq-ink, #12161C)')
    expect(tokens.canvas).toBe('var(--nq-canvas, #FFFFFF)')
  })

  it('keep a multi-part fallback intact (shadows contain commas)', () => {
    expect(tokens.shadowCard.startsWith('var(--nq-shadow-card, 0 1px 3px')).toBe(true)
    expect(tokens.shadowCard.endsWith(')')).toBe(true)
  })

  it('leave fonts and radii as plain strings', () => {
    expect(tokens.sans).toContain('Inter')
    expect(tokens.radiusMd).toBe('8px')
    expect(tokens.mono).not.toContain('var(')
  })

  it('kebab-cases CSS variable names, including digits', () => {
    expect(tokenVarName('canvasSoft2')).toBe('--nq-canvas-soft-2')
    expect(tokenVarName('onNightMuted')).toBe('--nq-on-night-muted')
  })
})

describe('tokenCssVars', () => {
  it('emits one variable per token with the literal value for the mode', () => {
    const dark = tokenCssVars('dark')
    const light = tokenCssVars('light')
    expect(dark['--nq-canvas']).toBe(darkTokens.canvas)
    expect(light['--nq-canvas']).toBe(lightTokens.canvas)
    expect(Object.keys(dark)).toHaveLength(Object.keys(darkTokens).length)
  })

  it('treats anything other than "dark" as light (semi-dark content is light)', () => {
    expect(tokenCssVars('semi-dark')['--nq-ink']).toBe(lightTokens.ink)
  })
})

describe('literal values for MUI palette and charts', () => {
  it('rawTokens are real colors, never var() (MUI alpha/darken would throw)', () => {
    Object.entries(rawTokens).forEach(([key, value]) => {
      expect(String(value), key).not.toContain('var(')
    })
  })

  it('tokensForMode returns the dark map in dark mode and includes fonts', () => {
    expect(tokensForMode('dark').ink).toBe(darkTokens.ink)
    expect(tokensForMode('light').ink).toBe(lightTokens.ink)
    expect(tokensForMode('dark').sans).toContain('Inter')
  })
})

describe('codebase usage', () => {
  function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(full)
      return /\.(js|jsx)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : []
    })
  }

  it('only references tokens that exist (a typo would render as "undefined")', () => {
    const known = new Set(Object.keys(tokens))
    const missing = []
    walk(path.resolve(__dirname, '..')).forEach(file => {
      const source = fs.readFileSync(file, 'utf8')
      // `ops` is also a Redux slice name; only files that import the token modules count.
      if (!/from ['"]src\/(theme\/tokens|styles\/opsSurface)['"]/.test(source)) return
      const pattern = /\b(?:ops|tokens)\.([A-Za-z][A-Za-z0-9]*)\b/g
      let match
      while ((match = pattern.exec(source))) {
        if (!known.has(match[1])) missing.push(`${path.relative(process.cwd(), file)}: ${match[0]}`)
      }
    })
    expect(missing).toEqual([])
  })
})
