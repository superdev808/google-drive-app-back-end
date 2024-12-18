const { getOAuth2ClientFromToken } = require("../services/oauth")
const { google } = require("googleapis")
const fs = require("fs")
const multer = require("multer")
const upload = multer({ dest: "uploads/" })

exports.setupFilesRoutes = (app) => {
  app.get("/files", async (req, res, next) => {
    try {
      const oauth2Client = getOAuth2ClientFromToken(req)
      const drive = google.drive({ version: "v3", auth: oauth2Client })

      const response = await drive.files.list({
        fields: "files(id, name, mimeType, modifiedTime)", // Request 'modifiedTime'
      })
      res.json(response.data.files)
    } catch (err) {
      next(err) // Pass error to middleware
    }
  })

  app.post("/upload", upload.single("file"), async (req, res, next) => {
    try {
      const oauth2Client = getOAuth2ClientFromToken(req)
      const drive = google.drive({ version: "v3", auth: oauth2Client })

      const fileMetadata = { name: req.file.originalname }
      const media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      }

      const response = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: "id",
      })

      fs.unlinkSync(req.file.path) // Clean up uploaded file
      res.json({ fileId: response.data.id })
    } catch (err) {
      next(err)
    }
  })

  app.get("/download/:fileId", async (req, res, next) => {
    try {
      const oauth2Client = getOAuth2ClientFromToken(req)
      const drive = google.drive({ version: "v3", auth: oauth2Client })
      const fileId = req.params.fileId

      const response = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
      )

      response.data
        .on("end", () => console.log("Download complete"))
        .on("error", (err) => console.error("Error downloading file", err))
        .pipe(res)
    } catch (err) {
      next(err)
    }
  })

  app.delete("/delete/:fileId", async (req, res, next) => {
    try {
      const oauth2Client = getOAuth2ClientFromToken(req)
      const drive = google.drive({ version: "v3", auth: oauth2Client })
      const fileId = req.params.fileId

      await drive.files.delete({ fileId })
      res.send("File deleted successfully")
    } catch (err) {
      next(err)
    }
  })
}
