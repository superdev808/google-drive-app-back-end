const { getOAuth2Client, SCOPES } = require("../services/oauth")

exports.setupAuthRoutes = (app) => {
  app.get("/auth", (req, res) => {
    const oauth2Client = getOAuth2Client()
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // Ensures refresh_token is returned
      prompt: "consent", // Forces the consent screen to show
      scope: SCOPES,
      include_granted_scopes: true,
    })
    res.redirect(authUrl)
  })

  app.get("/callback", async (req, res) => {
    const code = req.query.code

    try {
      const oauth2Client = getOAuth2Client()
      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)

      // Redirect to frontend with tokens in the query string
      res.redirect(
        `${process.env.FRONT_END_URI}?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`
      )
    } catch (err) {
      res.status(400).send("Error during authentication")
    }
  })
}
