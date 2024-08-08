import { describe, expect, it } from 'bun:test'
import app from '.'

describe('My first test', () => {
  it('Should return 200 Response', async () => {
    const req = new Request('http://localhost:3000/index.html')
    const res = await app.fetch(req)
    expect(res.status).toBe(200)
  })
})