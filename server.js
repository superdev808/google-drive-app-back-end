const express = require("express")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const cors = require("cors")
const { setupAuthRoutes } = require("./routers/auth")
const { setupFilesRoutes } = require("./routers/files")
const { validateToken, errorHandler } = require("./services/middlewares")

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.json())
// Enable CORS for all origins
app.use(cors())

setupAuthRoutes(app)

// Routes with token validation
app.use(validateToken)

setupFilesRoutes(app)

// Error Handler
app.use(errorHandler)

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

module.exports = app
