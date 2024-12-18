# Backend Documentation

This documentation provides a comprehensive overview of the backend system, including routes, middleware, and services. The backend is built with **Node.js**, **Express**, and the **Google Drive API** for file management.

## Table of Contents

1. [Setup and Installation](#setup-and-installation)
2. [Environment Variables](#environment-variables)
3. [Google Auth Configuration](#google-auth-configuration)
4. [API Endpoints](#api-endpoints)
5. [Middleware](#middleware)
6. [Services](#services)
7. [Error Handling](#error-handling)

---

## 1. Setup and Installation

### Prerequisites

- Node.js (v16+ recommended)
- Google Cloud credentials for OAuth2
- Google Drive API enabled in your Google Cloud Project

### Installation

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (see [Environment Variables](#environment-variables)).
4. Start the server:
   ```bash
   npm start
   ```

To run the server in development mode:

```bash
npm run dev
```

To run tests:

```bash
npm test
```

---

## 2. Environment Variables

The backend uses the following environment variables for configuration. Add them to a `.env` file in the root directory.

| Variable Name          | Description                             |
| ---------------------- | --------------------------------------- |
| `GOOGLE_CLIENT_ID`     | OAuth2 Client ID                        |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Client Secret                    |
| `REDIRECT_URI`         | Redirect URI for Google OAuth2 callback |
| `FRONT_END_URI`        | URI of the frontend application         |
| `PORT`                 | Port on which the server runs           |

---

## 3. Google Auth Configuration

To configure Google Auth for your backend:

### Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the **Google Drive API** and **Google OAuth2** API for your project.

### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services > OAuth consent screen**.
2. Select "External" for the user type.
3. Fill in the required details (app name, support email, etc.).
4. Add your frontend URI to the "Authorized domains" section.

### Step 3: Create OAuth2 Credentials

1. Go to **APIs & Services > Credentials**.
2. Click "Create Credentials" and select "OAuth 2.0 Client IDs".
3. Set the application type to "Web application".
4. Under "Authorized redirect URIs", add your backend redirect URI (e.g., `http://localhost:3000/callback`).
5. Save the credentials. Copy the **Client ID** and **Client Secret**.

### Step 4: Update Environment Variables

Add the credentials to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
REDIRECT_URI=http://localhost:3000/callback
FRONT_END_URI=http://localhost:3000
```

### Step 5: Test Google Authentication

1. Start the server using `npm start`.
2. Navigate to the `/auth` endpoint in your browser. It should redirect you to the Google login page.
3. Complete the login process. The server should handle the callback and provide tokens.

---

## 4. API Endpoints

### **1. Authentication Routes**

#### `GET /auth`

- **Description**: Redirects the user to the Google OAuth2 login page.
- **Response**: Redirects to Google OAuth URL.

#### `GET /callback`

- **Description**: Handles the OAuth2 callback and retrieves access tokens.
- **Query Parameters**:
  - `code`: The authorization code provided by Google.
- **Response**:
  - Redirects to the frontend with `access_token` and `refresh_token` as query parameters.

---

### **2. File Management Routes**

#### `GET /files`

- **Description**: Fetches the list of files from the user's Google Drive.
- **Headers**:
  - `Authorization: Bearer <access_token>`
- **Response**:
  - `200 OK`: Returns an array of files in the format:
    ```json
    [
      {
        "id": "fileId",
        "name": "fileName",
        "mimeType": "fileType",
        "modifiedTime": "2023-01-01T00:00:00Z"
      }
    ]
    ```
  - `401 Unauthorized`: If the token is invalid or missing.

#### `POST /upload`

- **Description**: Uploads a file to the user's Google Drive.
- **Headers**:
  - `Authorization: Bearer <access_token>`
- **Request Body**:
  - Multipart form data containing the file.
- **Response**:
  - `200 OK`: Returns the uploaded file ID:
    ```json
    { "fileId": "mock-file-id" }
    ```
  - `401 Unauthorized`: If the token is invalid or missing.

#### `GET /download/:fileId`

- **Description**: Downloads a file from the user's Google Drive.
- **Headers**:
  - `Authorization: Bearer <access_token>`
- **Response**:
  - Streams the file content.
  - `401 Unauthorized`: If the token is invalid or missing.

#### `DELETE /delete/:fileId`

- **Description**: Deletes a file from the user's Google Drive.
- **Headers**:
  - `Authorization: Bearer <access_token>`
- **Response**:
  - `200 OK`: Confirms the file deletion:
    ```json
    { "message": "File deleted successfully." }
    ```
  - `401 Unauthorized`: If the token is invalid or missing.

---

## 5. Middleware

### **1. `validateToken` Middleware**

- **Description**: Validates the `Authorization` header and checks the token's validity.
- **Behavior**:
  - If the token is valid: Calls `next()`.
  - If the token is missing or invalid: Returns a `401 Unauthorized` response.
- **Code**:

  ```javascript
  const validateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" })
    }

    const token = authHeader.split(" ")[1]

    try {
      const oauth2Client = new google.auth.OAuth2()
      oauth2Client.setCredentials({ access_token: token })
      await oauth2Client.getTokenInfo(token)
      next()
    } catch (err) {
      res.status(401).json({ error: "Unauthorized: Invalid or expired token" })
    }
  }
  ```

---

## 6. Services

### **1. `oauth.js`**

- Provides utility functions for OAuth2 operations.
- **Functions**:
  - `getOAuth2Client()`: Returns an instance of the OAuth2 client.
  - `getOAuth2ClientFromToken(token)`: Returns an authenticated OAuth2 client.

### **2. `googleapis` Integration**

- **Usage**:
  - Used to interact with Google Drive API for file management.
  - Mocked during testing to simulate real API responses.

---

## 7. Error Handling

### **Global Error Handler**

- Handles unhandled errors and returns a consistent response.
- **Example**:
  ```javascript
  app.use((err, req, res, next) => {
    console.error(err.stack)
    res
      .status(err.status || 500)
      .json({ error: err.message || "Internal Server Error" })
  })
  ```

### **Common Errors**

| Error Code | Description                               |
| ---------- | ----------------------------------------- |
| `401`      | Unauthorized: Token is missing or invalid |
| `500`      | Internal Server Error                     |

---