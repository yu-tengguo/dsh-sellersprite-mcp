import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('portable DSH package', () => {
  it('uses only the schemastery package vendored by DSH at runtime', () => {
    expect(read('src/index.ts')).toContain("from '@deepseek-ai/schemastery'")
    expect(read('lib/index.js')).toContain('from "@deepseek-ai/schemastery"')
    expect(read('lib/index.js')).not.toMatch(/from ["']schemastery["']/)
  })

  it('does not require an npm production dependency tree', () => {
    const manifest = JSON.parse(read('package.json')) as { dependencies?: Record<string, string> }
    expect(manifest.dependencies ?? {}).toEqual({})
  })

  it('declares the workspace root for pnpm 9 compatibility', () => {
    expect(read('pnpm-workspace.yaml')).toMatch(/^packages:\s*\n\s+- \.\s*$/m)
  })
})
