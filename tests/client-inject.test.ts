import { describe, expect, it } from 'vitest'
import { inject } from '../src/client/index.tsx'

describe('client service dependencies', () => {
  it('does not block web boot when the credentials remote is unavailable', () => {
    expect(inject).toContain('remote')
    expect(inject).not.toContain('remote.credentials')
  })
})
