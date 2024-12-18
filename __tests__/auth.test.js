const request = require("supertest")
const app = require("../server")
const { getOAuth2Client } = require("../services/oauth")

jest.mock("../services/oauth")

describe("Auth Routes", () => {
  it("redirects to Google OAuth URL for /auth", async () => {
    getOAuth2Client.mockReturnValue({
      generateAuthUrl: jest.fn(() => "https://mock-oauth-url.com"),
    })

    const res = await request(app).get("/auth")

    expect(res.status).toBe(302) // Redirect status
    expect(res.header.location).toBe("https://mock-oauth-url.com")
  })

  it("returns tokens on /callback with valid code", async () => {
    const mockGetToken = jest.fn(() => ({
      tokens: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      },
    }))

    getOAuth2Client.mockReturnValue({
      getToken: mockGetToken,
      setCredentials: jest.fn(),
    })

    const res = await request(app).get("/callback").query({ code: "mock-code" })

    expect(mockGetToken).toHaveBeenCalledWith("mock-code")
    expect(res.status).toBe(302)
    expect(res.header.location).toContain("access_token=mock-access-token")
    expect(res.header.location).toContain("refresh_token=mock-refresh-token")
  })
})
