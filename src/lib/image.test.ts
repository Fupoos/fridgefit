import { describe, expect, it } from 'vitest'
import { fitWithin } from './image'

describe('fitWithin', () => {
  it('scales the long edge down to the limit, keeping aspect ratio', () => {
    expect(fitWithin(4032, 3024, 1024)).toEqual({ width: 1024, height: 768 })
    expect(fitWithin(3024, 4032, 1024)).toEqual({ width: 768, height: 1024 })
  })

  it('never upscales', () => {
    expect(fitWithin(800, 600, 1024)).toEqual({ width: 800, height: 600 })
  })
})
