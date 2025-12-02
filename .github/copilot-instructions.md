# Easy BG Remover - Copilot Instructions

## Project Overview
This is an Electron.js desktop application that removes backgrounds from images using the @imgly/background-removal-node package.

## Technology Stack
- Electron.js - Desktop application framework
- @imgly/background-removal-node - AI-powered background removal
- Node.js - Backend runtime

## Project Structure
```
easy_bg_remover/
├── src/
│   ├── main.js          # Electron main process
│   ├── preload.js       # Preload script for IPC
│   ├── renderer.js      # Renderer process logic
│   ├── index.html       # Main UI
│   └── styles.css       # Application styles
├── package.json
└── README.md
```

## Development Commands
- `npm install` - Install dependencies
- `npm start` - Run the application
- `npm run build` - Build for production (if configured)

## Key Features
- Select image files via file dialog
- Remove background using AI
- Preview original and processed images
- Save processed images

## Development Guidelines
- Keep the main process lean, handle heavy operations in separate threads
- Use IPC for communication between main and renderer processes
- Handle errors gracefully with user-friendly messages
