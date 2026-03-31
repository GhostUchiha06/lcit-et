# SmartBoard

A clean and modern web application for teachers to display notes and use an interactive whiteboard. Built with Next.js 14, Tldraw, and Tailwind CSS.

## Features

- **Three View Modes**: Notes Only, Whiteboard Only, or Both (side by side)
- **Resizable Panels**: Adjust the split ratio when in Both mode
- **Slide Navigation**: Support for multiple note sets with easy navigation
- **Interactive Whiteboard**: Built with Tldraw for drawing and collaboration
- **Customizable Background**: Choose from 8 colors, dot grid or line grid patterns
- **Drawing Tools**: Pen with adjustable stroke thickness, Eraser with size and softness
- **Export Options**: Export whiteboard as PNG
- **Google Drive Integration**:
  - **Save to Drive**: Save whiteboard as PNG directly to Google Drive
  - **Open Files**: Browse and download previously saved files from Drive
  - **Auto Folder Organization**: Files are saved in folders organized by date
  - **Timestamp Filenames**: Files are named with format `YYYY-MM-DD_HH-MM-SS.png`
- **Full Screen Mode**: Distraction-free presentation mode
- **Keyboard Shortcuts**: 
  - `F` - Toggle fullscreen
  - `1` - Notes only
  - `2` - Whiteboard only
  - `3` - Both modes
  - `E` - Toggle Pen/Eraser
- **Auto-save**: Whiteboard state is automatically saved to localStorage

## Google Drive Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google Drive API**

### Step 2: Create Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Give it a name (e.g., "SmartBoard Drive")
4. Click **Create and Continue**
5. Skip optional steps and click **Done**

### Step 3: Generate JSON Key

1. Click on your newly created service account
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** and click **Create**
5. The JSON file will download automatically

### Step 4: Share Your Drive Folder

1. Open Google Drive (drive.google.com)
2. Create a new folder named `SmartBoard-Exports` (or any name)
3. Right-click the folder > **Share**
4. Add the service account email from the JSON file (`client_email`)
5. Give it **Editor** access
6. Click **Send**

### Step 5: Configure Environment

Copy the entire JSON content from the downloaded file and add it to your `.env` file:

```env
GOOGLE_SERVICE_ACCOUNT_KEY={
  "type":"service_account",
  "project_id":"your-project-id",
  "private_key_id":"your-key-id",
  "private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n",
  "client_email":"your-service@your-project.iam.gserviceaccount.com",
  ...
}
```

**Important**: 
- Make sure the private key has `\n` for newlines
- The JSON should be on a single line in the .env file

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file with your Google Service Account key:

```bash
cp .env.example .env
```

Edit the `.env` file and replace the placeholder with your actual service account JSON key.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
smartboard/
├── app/
│   ├── api/
│   │   └── drive/route.ts           # Google Drive API routes
│   ├── dashboard/page.tsx           # Main dashboard page
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Redirect to dashboard
├── components/
│   └── smartboard/
│       └── SmartBoard.tsx           # Main SmartBoard component
├── lib/
│   ├── drive.ts                    # Google Drive service functions
│   ├── types.ts                    # TypeScript types
│   └── utils.ts                    # Utility functions
├── .env.example                    # Environment variables template
├── .env                            # Environment variables (gitignored)
├── next.config.js                  # Next.js configuration
├── package.json                    # Dependencies
├── tailwind.config.ts              # Tailwind CSS configuration
└── tsconfig.json                   # TypeScript configuration

```

## Deployment to Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Set the build command: `npm run build`
3. Set the build output directory: `.next`
4. Add environment variable:
   - `GOOGLE_SERVICE_ACCOUNT_KEY` - Your full JSON service account key

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Whiteboard**: Tldraw v2
- **Icons**: lucide-react
- **Notifications**: sonner
- **Google Drive**: googleapis (Service Account)
- **State Management**: React hooks + localStorage

## Troubleshooting

### Drive Connection Error
- Make sure you've enabled Google Drive API in Google Cloud Console
- Verify the service account email has access to your Drive folder
- Check that the JSON key is properly formatted in `.env`

### Files Not Showing
- Wait a moment after saving - files may take a few seconds to appear
- Click the refresh button in the Notes panel
- Check if the service account has access to the folder

### Export Issues
- Make sure you have drawn content on the whiteboard before exporting
- Check browser console for any errors

## License

MIT
