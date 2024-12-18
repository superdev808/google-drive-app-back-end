const { google } = require("googleapis")

exports.SCOPES = ["https://www.googleapis.com/auth/drive"]

exports.getOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
  )

  return oauth2Client
}

exports.getOAuth2ClientFromToken = (req) => {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({
    access_token: req.headers.authorization.split(" ")[1],
  })
  return oauth2Client
}
