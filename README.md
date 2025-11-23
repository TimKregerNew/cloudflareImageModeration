# Photo Review Dashboard

A web-based image moderation system that allows administrators to review, approve, and reject images stored in Cloudflare Images. The application syncs images from Cloudflare to Firestore for tracking review status and provides an intuitive interface for managing image approvals.

## Overview

This application serves as a content moderation dashboard where administrators can:

- **Sync images** from Cloudflare Images to Firestore for tracking
- **Review unreviewed images** that need moderation decisions
- **Approve images** to mark them as accepted content
- **Reject images** to permanently delete them from both Cloudflare and Firestore
- **View approved images** to see previously moderated content

## Features

### 🔐 Authentication
- Password-protected login using NextAuth
- Session-based authentication with middleware protection
- Secure credential validation

### 📸 Image Management
- **Sync from Cloudflare**: Pull all images from your Cloudflare Images account into Firestore
- **Unreviewed Images**: View all images pending review (status: `pending`)
- **Approved Images**: Browse previously approved images (status: `approved`)
- **Image Metadata**: Display image ID, upload date, and custom metadata
- **Optimistic UI Updates**: Instant feedback when approving/rejecting images

### 🎨 User Interface
- Dark theme with modern, responsive design
- Grid layout for efficient image browsing
- Tab-based navigation between unreviewed and approved images
- Loading states and error handling
- Image cards with hover effects

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.0
- **Authentication**: NextAuth.js
- **Database**: Firebase Firestore (via Firebase Admin SDK)
- **Image Storage**: Cloudflare Images API
- **HTTP Client**: Axios
- **Styling**: CSS with CSS Variables

## Prerequisites

- Node.js 18+ and npm
- A Cloudflare account with Images enabled
- A Firebase project with Firestore database
- Cloudflare API token with Images read/write permissions

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd photo-review
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Configure your `.env.local` file with the following variables:

```env
# Cloudflare Images API
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# Authentication
AUTH_SECRET=generate_a_secret_here  # Use: openssl rand -base64 32
ADMIN_PASSWORD=secure_password
```

### Getting Your Credentials

**Cloudflare:**
- Account ID: Found in your Cloudflare dashboard URL or account settings
- API Token: Create a token with `Account.Cloudflare Images:Edit` permissions at https://dash.cloudflare.com/profile/api-tokens

**Firebase:**
- Create a service account in Firebase Console → Project Settings → Service Accounts
- Download the JSON key file and extract the required fields:
  - `project_id` → `FIREBASE_PROJECT_ID`
  - `client_email` → `FIREBASE_CLIENT_EMAIL`
  - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters or the app will handle them)

**Auth Secret:**
- Generate a random secret: `openssl rand -base64 32`

## Usage

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## How It Works

### Image Sync Process

1. Click **"Sync from Cloudflare"** to fetch all images from your Cloudflare Images account
2. New images are added to Firestore with status `pending`
3. Images that no longer exist in Cloudflare (and are still pending) are removed from Firestore
4. Approved images are preserved in Firestore even if removed from Cloudflare

### Review Workflow

1. **View Unreviewed Images**: Navigate to the "Unreviewed" tab to see all pending images
2. **Approve**: Click "Approve" to mark an image as accepted
   - Updates Firestore status to `approved`
   - Records approval timestamp
   - Image moves to the "Approved" tab
3. **Reject**: Click "Reject" to permanently delete an image
   - Deletes from Cloudflare Images
   - Removes from Firestore
   - Requires confirmation before deletion

### Database Structure

Images are stored in Firestore with the following structure:

```javascript
{
  cloudflareId: string,      // Cloudflare image ID
  url: string,               // Image URL/variant
  metadata: object,          // Custom metadata from Cloudflare
  status: 'pending' | 'approved',
  uploaded: Timestamp,       // Upload date
  approvedAt?: Timestamp     // Approval date (if approved)
}
```

## API Routes

- `GET /api/images/unreviewed` - Fetch all pending images
- `GET /api/images/approved` - Fetch all approved images
- `POST /api/images/sync` - Sync images from Cloudflare to Firestore
- `POST /api/images/approve` - Approve an image
- `DELETE /api/images/reject?id={id}` - Reject and delete an image

## Project Structure

```
photo-review/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # NextAuth configuration
│   │   │   └── images/               # Image management API routes
│   │   ├── login/                   # Login page
│   │   ├── page.js                  # Main dashboard
│   │   └── layout.js                # Root layout
│   ├── components/
│   │   └── ImageCard.js             # Image card component
│   ├── lib/
│   │   └── firebase.js              # Firebase Admin initialization
│   └── middleware.js                # Auth middleware
├── public/                          # Static assets
└── package.json
```

## Security Considerations

- All routes except `/login` are protected by authentication middleware
- Admin password is validated server-side
- Cloudflare API tokens should have minimal required permissions
- Firebase service account should be restricted to the specific database
- Use strong passwords and secure `AUTH_SECRET` in production

## Limitations & Future Improvements

- Currently handles up to 100 images per sync (Cloudflare API pagination not fully implemented)
- No bulk approve/reject functionality
- No image preview/zoom functionality
- No filtering or search capabilities
- No user management (single admin password)

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
