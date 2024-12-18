const { google } = require("googleapis")

exports.validateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" })
  }

  const token = authHeader.split(" ")[1]

  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: token })

    // Validate the token
    const tokenInfo = await oauth2Client.getTokenInfo(token)

    // Add the token info to the request for downstream use
    req.user = tokenInfo
    next()
  } catch (err) {
    console.error("Token validation error:", err)
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" })
  }
}

exports.errorHandler = (err, req, res, next) => {
  res.status(err.status || 500).json({
    error:
      err?.response?.data?.error?.message ||
      err?.message ||
      "Internal Server Error",
  })
}
