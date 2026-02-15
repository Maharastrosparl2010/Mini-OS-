# Project File Structure

## Overview
This project contains two separate web applications organized into separate files for maintainability and clarity.

---

## Root Application Files

### **index.html** ⭐ MAIN ENTRY POINT
- **Purpose**: Application launcher/home page
- **Contents**: Links to both Mini OS and Community App
- **Styling**: Inline CSS (gradient background, app cards)
- **Usage**: Open this file in browser to access both apps

---

## App 1: Mini OS (Desktop Environment)

### **new.html**
- **Purpose**: Main HTML file for Mini OS desktop environment
- **Features**:
  - Desktop icons (Notepad, Explorer, Wallpapers, Recycle Bin)
  - Windowed taskbar with system tray
  - Window management system
- **Dependencies**: 
  - Linked to: `script.js` & `style.css`

### **script.js** (683 lines)
- **Purpose**: JavaScript logic for Mini OS
- **Features**:
  - Window creation and management
  - Notepad functionality
  - File Explorer
  - Wallpaper management
  - Keyboard shortcuts (Ctrl+S, Ctrl+D, Ctrl+X)
  - localStorage integration
- **Key Functions**:
  - `createWindow()` - Create draggable windows
  - `openNotepad()` - Open text editor
  - `openExplorer()` - File management interface
  - `setWallpaper()` - Change desktop background

### **style.css** (285 lines)
- **Purpose**: Styling for Mini OS
- **Components**:
  - Desktop layout & icons
  - Window styling (titlebar, buttons)
  - Taskbar & system tray
  - Taskbar buttons with hover effects
  - Dialog boxes & modals
  - Notepad window styling
  - File explorer styling

---

## App 2: Community Platform

### **comm.html**
- **Purpose**: Main HTML file for Community App
- **Features**:
  - User authentication (login system)
  - Real-time chat
  - Announcements
  - Calendar with events
  - Attendance marking
  - Teacher management
  - News updates
- **Dependencies**:
  - Linked to: `comm.css` & `comm.js`

### **comm.css** (350+ lines)
- **Purpose**: Complete styling for Community App
- **CSS Variables** (Color scheme):
  - `--primary`: #6c5ce7 (Purple)
  - `--accent`: #00cec9 (Cyan)
  - `--danger`: #ff7675 (Red)
  - `--success`: #00b894 (Green)
  - `--warning`: #fdcb6e (Orange)
- **Components Styled**:
  - Login screen
  - Navigation header
  - Grid menu layout
  - Chat interface
  - Announcements
  - Calendar
  - Event management
  - User management (admin controls)
  - Responsive design

### **comm.js** (large)
- **Purpose**: JavaScript logic for Community App
- **Data Management** (localStorage):
  - User storage
  - Chat messages
  - Announcements
  - Events
  - Attendance history
  - User ban list
  - Teacher contact info
- **Key Functions**:
  - `openApp()` - Open feature viewer
  - `renderChat()` - Chat interface rendering
  - `renderAnnouncements()` - Announcement display
  - `initCal()` - Calendar initialization
  - `markAttn()` - Attendance marking
  - `openUserControl()` - User management (admin)
  
- **Login Credentials**:
  - Admin: `admin` / `admin@157390`
  - Users: Any from USERS array / `1234`

---

## File Organization Summary

```
Root Directory
├── index.html              (Launcher/Home)
├── FILE_STRUCTURE.md       (This file)
├── README.md               (Project info)
│
├── Mini OS App
│   ├── new.html           (Desktop environment)
│   ├── script.js          (Logic: windows, notepad, explorer)
│   └── style.css          (Styling: desktop, windows, taskbar)
│
├── Community App
│   ├── comm.html          (Main app interface)
│   ├── comm.css           (Styling: all UI components)
│   └── comm.js            (Logic: auth, chat, events, attendance)
│
└── public/                (Static files folder - currently empty)
```

---

## How to Use

1. **Start with index.html** - Open in browser
2. **Choose an app**:
   - Click "Mini OS" for desktop environment
   - Click "Community App" for platform
3. **Mini OS**:
   - Double-click icons to open apps
   - Drag windows to move
   - Click taskbar buttons to minimize/restore
4. **Community App**:
   - Login with credentials (see comm.js)
   - Navigate using menu grid
   - Interact with features

---

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Flexbox, Grid, Animations, Gradients, Backdrop blur
- **JavaScript (Vanilla)**: No frameworks
- **Storage**: localStorage API with fallback memory storage

---

## Data Persistence

All data is stored in browser's localStorage:
- `aio_chat` - Chat messages
- `aio_anns_v2` - Announcements
- `aio_events_list` - Calendar events
- `aio_attn_history` - Attendance records
- `aio_banned_users` - Banned user list
- `aio_teachers_v3` - Teacher contacts
- `wallpaper` - Selected wallpaper

---

## Responsive Design

- Mobile-optimized layouts
- Touch-friendly interfaces
- Adaptive grid systems
- Viewport meta tags configured

---

## Future Improvements

- [ ] Extract reusable CSS variables to separate file
- [ ] Separate authentication into auth.js
- [ ] Create utilities.js for common functions
- [ ] Add service worker for offline support
- [ ] Mobile app conversion (React Native/Flutter)
- [ ] Backend API integration
