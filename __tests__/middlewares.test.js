const { validateToken } = require("../services/middlewares")
const { google } = require("googleapis")

jest.mock("googleapis")

describe("validateToken Middleware", () => {
  it("returns 401 if no token is provided", async () => {
    const req = { headers: {} }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()

    await validateToken(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized: No token provided",
    })
    expect(next).not.toHaveBeenCalled()
  })

  it("calls next if token is valid", async () => {
    const req = { headers: { authorization: "Bearer mock-token" } }
    const res = {}
    const next = jest.fn()
    const mockGetTokenInfo = jest.fn(() => ({ token: "mock-token" }))

    google.auth.OAuth2.mockImplementation(() => ({
      setCredentials: jest.fn(),
      getTokenInfo: mockGetTokenInfo,
    }))

    await validateToken(req, res, next)

    expect(next).toHaveBeenCalled()
  })
})
