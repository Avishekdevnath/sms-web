## Messaging/Announcements – Missing Environment Variables

The following variables are still needed to fully enable realtime messaging, announcements email fan‑out, and template management.

### Required
- ABLY_API_KEY
  - Purpose: Ably realtime auth (server publish + client tokens)

- EMAIL_PROVIDER
  - Expected: `smtp`
  - Purpose: Select email transport

- EMAIL_FROM
  - Example: `avishekdevnathofficial@gmail.com`
  - Purpose: From address used in outbound emails

- APP_BASE_URL
  - Example: `https://your-domain.com`
  - Purpose: Build absolute links (e.g., unsubscribe URLs)

- EMAIL_UNSUBSCRIBE_SECRET
  - Purpose: Sign unsubscribe tokens for opt‑out links

### Optional (Recommended)
- ABLY_USE_TOKEN_AUTH
  - Default: `true`
  - Purpose: Client obtains token via `/api/realtime/ably/token`

- ABLY_TOKEN_TTL_SECONDS
  - Default: `3600`
  - Purpose: Token lifetime

- NOTIFICATION_EMAIL_ENABLED
  - Default: `true`
  - Purpose: Toggle announcement email fan‑out

- NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  - Purpose: Unsigned uploads from client (images only)

### Already Present (FYI)
- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (present)
- CLOUDINARY_API_KEY (present)
- CLOUDINARY_API_SECRET (present)
- EMAIL_HOST (present)
- EMAIL_PORT (present)
- EMAIL_USER (present)
- EMAIL_APP_PASSWORD (present)
- EMAIL_FROM_NAME (present)


