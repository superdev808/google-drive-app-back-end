const request = require("supertest")
const app = require("../server") // Express app
const { getOAuth2ClientFromToken } = require("../services/oauth")
const { google } = require("googleapis")

jest.mock("../services/oauth")
jest.mock("googleapis", () => ({
  google: {
    drive: jest.fn(() => ({
      files: {
        list: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
      },
    })),
    auth: {
      OAuth2: jest.fn(() => ({
        setCredentials: jest.fn(),
        getTokenInfo: jest.fn(),
      })),
    },
  },
}))

describe("Files Routes", () => {
  let mockDrive

  beforeEach(() => {
    // Mock OAuth2 client
    getOAuth2ClientFromToken.mockReturnValue({
      credentials: { access_token: "mock-access-token" },
    })

    // Mock Google Drive API
    mockDrive = google.drive()
    jest.clearAllMocks() // Clear mock state
  })

  it("fetches files on /files", async () => {
    mockDrive.files.list.mockResolvedValueOnce({
      data: { files: [{ id: "1", name: "File 1", mimeType: "text/plain" }] },
    })

    const res = await request(app)
      .get("/files")
      .set("Authorization", "Bearer mock-access-token")

    expect(mockDrive.files.list).toHaveBeenCalledWith({
      fields: "files(id, name, mimeType, modifiedTime)",
    })
    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      { id: "1", name: "File 1", mimeType: "text/plain" },
    ])
  })

  it("uploads a file on /upload", async () => {
    mockDrive.files.create.mockResolvedValueOnce({
      data: { id: "mock-file-id" },
    })

    const res = await request(app)
      .post("/upload")
      .set("Authorization", "Bearer mock-access-token")
      .attach("file", Buffer.from("mock content"), "mock-file.txt")

    expect(mockDrive.files.create).toHaveBeenCalledWith({
      requestBody: { name: "mock-file.txt" },
      media: { body: expect.anything() },
    })
    expect(res.status).toBe(200)
    expect(res.body.fileId).toBe("mock-file-id")
  })

  it("downloads a file on /download/:fileId", async () => {
    const mockStream = { pipe: jest.fn() }
    mockDrive.files.get.mockReturnValueOnce({
      data: { on: jest.fn((event, callback) => callback()) },
    })

    const res = await request(app)
      .get("/download/1")
      .set("Authorization", "Bearer mock-access-token")

    expect(mockDrive.files.get).toHaveBeenCalledWith(
      { fileId: "1", alt: "media" },
      { responseType: "stream" }
    )
    expect(res.status).toBe(200)
  })

  it("deletes a file on /delete/:fileId", async () => {
    mockDrive.files.delete.mockResolvedValueOnce({})

    const res = await request(app)
      .delete("/delete/1")
      .set("Authorization", "Bearer mock-access-token")

    expect(mockDrive.files.delete).toHaveBeenCalledWith({ fileId: "1" })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: "File deleted successfully." })
  })

  it("returns 401 if Authorization header is missing", async () => {
    const res = await request(app).get("/files")

    expect(res.status).toBe(401)
    expect(res.body.error).toBe("Unauthorized: No token provided")
  })

  it("handles error when fetching files fails", async () => {
    mockDrive.files.list.mockRejectedValueOnce(new Error("Fetch error"))

    const res = await request(app)
      .get("/files")
      .set("Authorization", "Bearer mock-access-token")

    expect(mockDrive.files.list).toHaveBeenCalled()
    expect(res.status).toBe(500)
    expect(res.body.error).toBe("Failed to fetch files")
  })
})
