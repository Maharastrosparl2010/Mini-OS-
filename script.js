let z = 100;
let windows = {};
let currentActiveWindow = null;
let isResizing = false;
let isDragging = false;

// Update clock every second
setInterval(() => {
  const now = new Date();
  document.getElementById("clock").innerText = 
    now.getHours().toString().padStart(2,'0') + ':' + 
    now.getMinutes().toString().padStart(2,'0');
}, 1000);

// Keyboard Shortcuts
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey) {
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      handleSaveAndClose();
    } else if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      handleDeleteDialog();
    } else if (e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      handleCloseAllTabs();
    }
  }
});

// Get the currently focused window
function getFocusedWindow() {
  const allWindows = document.querySelectorAll(".window");
  if (allWindows.length === 0) return null;
  
  let maxZIndex = -1;
  let focusedWindow = null;
  
  allWindows.forEach(win => {
    const zIndex = parseInt(window.getComputedStyle(win).zIndex);
    if (!isNaN(zIndex) && zIndex > maxZIndex) {
      maxZIndex = zIndex;
      focusedWindow = win;
    }
  });
  
  return focusedWindow;
}

// Ctrl+S: Save document and close
function handleSaveAndClose() {
  const focusedWindow = getFocusedWindow();
  if (!focusedWindow) return;
  
  // Check if it's a Notepad window
  if (focusedWindow.querySelector("textarea")) {
    const saveBtn = focusedWindow.querySelector("button");
    if (saveBtn) {
      saveBtn.click();
      setTimeout(() => {
        // Refresh File Explorer windows to show newly saved file
        for (let id in windows) {
          if (windows[id].title === "File Explorer") {
            windows[id].element.remove();
            delete windows[id];
          }
        }
        openExplorer();
        
        // Close the notepad window
        const closeBtn = focusedWindow.querySelector(".close");
        if (closeBtn) closeBtn.click();
      }, 500);
    }
  }
}

// Ctrl+D: Show delete dialog
function handleDeleteDialog() {
  const focusedWindow = getFocusedWindow();
  if (!focusedWindow) return;
  
  // Check if it's the File Explorer window with file items
  const fileItems = focusedWindow.querySelectorAll(".file-item");
  if (fileItems.length === 0) return;
  
  // Create and show delete dialog
  showDeleteDialog();
}

// Delete dialog with three options
function showDeleteDialog() {
  let dialogOverlay = document.getElementById("deleteDialogOverlay");
  
  if (!dialogOverlay) {
    dialogOverlay = document.createElement("div");
    dialogOverlay.id = "deleteDialogOverlay";
    dialogOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    document.body.appendChild(dialogOverlay);
  }
  
  const dialog = document.createElement("div");
  dialog.id = "deleteDialog";
  dialog.style.cssText = `
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(102, 126, 234, 0.2);
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    min-width: 420px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;
  
  dialog.innerHTML = `
    <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">Delete Document</h3>
    <p style="margin: 0 0 28px 0; color: #666; font-size: 14px;">Select how you want to delete this file:</p>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <button onclick="performDelete('recycle')" style="padding: 12px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.3s ease; width: 100%;">
        🗑️ Move to Recycle Bin
      </button>
      <button onclick="performDelete('permanent')" style="padding: 12px 20px; background: rgba(255, 71, 87, 0.1); color: #ff4757; border: 1px solid rgba(255, 71, 87, 0.3); border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.3s ease; width: 100%;">
        ⚠️ Delete Permanently
      </button>
      <button onclick="performDelete('cancel')" style="padding: 12px 20px; background: rgba(0, 0, 0, 0.08); color: #333; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.3s ease; width: 100%;">
        Cancel
      </button>
    </div>
  `;
  
  dialogOverlay.appendChild(dialog);
}

// Perform delete action
function performDelete(action) {
  const dialogOverlay = document.getElementById("deleteDialogOverlay");
  const dialog = document.getElementById("deleteDialog");
  
  if (action === 'cancel') {
    if (dialog) dialog.remove();
    if (dialogOverlay) dialogOverlay.remove();
    return;
  }
  
  // Get the first file item from the focused window
  const focusedWindow = getFocusedWindow();
  if (!focusedWindow) {
    if (dialog) dialog.remove();
    if (dialogOverlay) dialogOverlay.remove();
    return;
  }
  
  const fileItem = focusedWindow.querySelector(".file-item");
  if (!fileItem) {
    if (dialog) dialog.remove();
    if (dialogOverlay) dialogOverlay.remove();
    return;
  }
  
  const filename = fileItem.innerText.split(" ")[0];
  
  if (action === 'recycle') {
    deleteFile(filename);
  } else if (action === 'permanent') {
    if (confirm(`Permanently delete '${filename}'?`)) {
      permanentDeleteFile(filename);
    } else {
      // User cancelled the confirm dialog, keep the delete dialog open
      return;
    }
  }
  
  // Close the dialog after deletion
  setTimeout(() => {
    if (dialog && dialog.parentElement) dialog.remove();
    if (dialogOverlay && dialogOverlay.parentElement) dialogOverlay.remove();
  }, 100);
}

// Ctrl+X: Close all tabs/windows
function handleCloseAllTabs() {
  const allWindows = document.querySelectorAll(".window");
  if (allWindows.length === 0) return;
  
  if (confirm("Close all open windows?")) {
    allWindows.forEach(win => {
      const closeBtn = win.querySelector(".close");
      if (closeBtn) closeBtn.click();
    });
  }
}

/* Window Creator */
function createWindow(title, contentHTML, onClose) {
  const id = 'win_' + Date.now();
  const win = document.createElement("div");
  win.className = "window";
  win.id = id;
  win.style.top = (Math.random() * 100 + 50) + "px";
  win.style.left = (Math.random() * 100 + 50) + "px";
  win.style.zIndex = ++z;

  const titlebar = document.createElement("div");
  titlebar.className = "titlebar";
  titlebar.innerHTML = `<span>${title}</span>`;

  const btns = document.createElement("div");
  btns.className = "buttons";

  const min = document.createElement("button");
  min.innerText = "−";
  min.title = "Minimize";
  min.onclick = (e) => {
    e.stopPropagation();
    win.classList.toggle("hidden");
    updateTaskbar();
  };

  const max = document.createElement("button");
  max.innerText = "□";
  max.title = "Maximize";
  max.onclick = (e) => {
    e.stopPropagation();
    if (win.style.width === "100%") {
      win.style.top = win.dataset.prevTop;
      win.style.left = win.dataset.prevLeft;
      win.style.width = win.dataset.prevWidth;
      win.style.height = win.dataset.prevHeight;
    } else {
      win.dataset.prevTop = win.style.top;
      win.dataset.prevLeft = win.style.left;
      win.dataset.prevWidth = win.style.width;
      win.dataset.prevHeight = win.style.height;
      win.style.top = "0";
      win.style.left = "0";
      win.style.width = "100%";
      win.style.height = "calc(100% - 40px)";
    }
  };

  const close = document.createElement("button");
  close.className = "close";
  close.innerText = "✕";
  close.title = "Close";
  close.onclick = (e) => {
    e.stopPropagation();
    if (!onClose || onClose()) {
      win.remove();
      delete windows[id];
      updateTaskbar();
    }
  };

  btns.append(min, max, close);
  titlebar.appendChild(btns);

  const content = document.createElement("div");
  content.className = "content";
  content.innerHTML = contentHTML;

  const resize = document.createElement("div");
  resize.className = "resize-handle";

  win.append(titlebar, content, resize);
  document.getElementById("desktop").appendChild(win);

  dragWindow(win, titlebar);
  resizeWindow(win, resize);

  windows[id] = { title, element: win };
  updateTaskbar();
  
  return win;
}

/* Drag and Resize Functions */
function dragWindow(win, titlebar) {
  let x, y;
  
  titlebar.onmousedown = (e) => {
    isDragging = true;
    x = e.clientX - win.offsetLeft;
    y = e.clientY - win.offsetTop;
    win.style.zIndex = ++z;
    win.style.transition = 'box-shadow 0.2s ease';
    win.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.25)';
    
    document.onmousemove = e2 => {
      win.style.left = (e2.clientX - x) + "px";
      win.style.top = (e2.clientY - y) + "px";
    };
    
    document.onmouseup = () => {
      isDragging = false;
      document.onmousemove = null;
      win.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
    };
  };
}

function resizeWindow(win, handle) {
  let startX, startY, startWidth, startHeight;
  
  handle.onmousedown = e => {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = win.offsetWidth;
    startHeight = win.offsetHeight;
    win.style.zIndex = ++z;
    
    document.onmousemove = e2 => {
      const newWidth = Math.max(250, startWidth + (e2.clientX - startX));
      const newHeight = Math.max(200, startHeight + (e2.clientY - startY));
      win.style.width = newWidth + "px";
      win.style.height = newHeight + "px";
    };
    
    document.onmouseup = () => {
      isResizing = false;
      document.onmousemove = null;
    };
  };
}

/* Update taskbar */
function updateTaskbar() {
  const container = document.getElementById("taskbar-items");
  container.innerHTML = "";
  
  for (let id in windows) {
    const w = windows[id];
    const btn = document.createElement("button");
    btn.className = "taskbar-btn";
    if (!w.element.classList.contains("hidden")) {
      btn.classList.add("active");
    }
    btn.innerText = w.title;
    btn.onclick = () => {
      if (w.element.classList.contains("hidden")) {
        w.element.classList.remove("hidden");
        btn.classList.add("active");
      } else {
        w.element.classList.add("hidden");
        btn.classList.remove("active");
      }
    };
    container.appendChild(btn);
  }
}

/* Notepad */
function openNotepad() {
  const noteId = "notearea_" + Date.now();
  const saveId = "savebtn_" + Date.now();
  const filenameId = "filename_" + Date.now();
  let saved = true;
  
  createWindow(
    "Notepad",
    `<div style="display: flex; flex-direction: column; height: calc(100% - 5px); background: rgba(255,255,255,0.4);">
      <div style="padding: 10px 12px; border-bottom: 1px solid rgba(0, 0, 0, 0.08); font-size: 13px; color: #666; display: flex; gap: 8px; align-items: center; background: rgba(255,255,255,0.3);">
        <span style="font-weight: 500;">File:</span> 
        <input type="text" id="${filenameId}" value="Document.txt" style="flex: 1; padding: 6px 10px; border: 1px solid rgba(102, 126, 234, 0.2); border-radius: 6px; font-size: 13px;">
        <button id="${saveId}" style="padding: 6px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">💾 Save</button>
      </div>
      <textarea id="${noteId}" style="flex: 1; border: none; padding: 16px; font-family: 'Courier New', monospace; font-size: 13px; resize: none; background: rgba(255,255,255,0.5);"></textarea>
    </div>`,
    () => {
      if (!saved) return confirm("Save changes before closing?");
      return true;
    }
  );
  
  const saveBtn = document.getElementById(saveId);
  const noteArea = document.getElementById(noteId);
  const fileInput = document.getElementById(filenameId);
  
  saveBtn.onmouseover = () => saveBtn.style.transform = 'translateY(-2px)';
  saveBtn.onmouseout = () => saveBtn.style.transform = 'translateY(0)';
  
  saveBtn.onclick = () => {
    const text = noteArea.value;
    const name = fileInput.value || "Document.txt";
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    files[name] = text;
    localStorage.setItem("files", JSON.stringify(files));
    saved = true;
    
    // Show success feedback
    saveBtn.style.background = 'linear-gradient(135deg, #00d084 0%, #00a67e 100%)';
    saveBtn.innerText = '✓ Saved';
    setTimeout(() => {
      saveBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      saveBtn.innerText = '💾 Save';
    }, 1500);
  };
  
  noteArea.oninput = () => saved = false;
}

/* Explorer */
function openExplorer() {
  const files = JSON.parse(localStorage.getItem("files") || "{}");
  const filesList = Object.keys(files).length > 0
    ? Object.keys(files).map(f => {
        const escapedName = f.replace(/'/g, "\\'");
        return `<div class="file-item" ondblclick="viewFile('${escapedName}')" oncontextmenu="showFileContextMenu(event, '${escapedName}')">${f} <span style="font-size: 12px; color: #666;">(${files[f].length} chars)</span></div>`;
      }).join("")
    : "<p style='color: #999; text-align: center; margin-top: 20px;'>No files</p>";
  
  createWindow("File Explorer", filesList);
}

/* View file */
function viewFile(filename) {
  const files = JSON.parse(localStorage.getItem("files") || "{}");
  const content = files[filename];
  if (content !== undefined) {
    createWindow(filename, `<pre style="white-space: pre-wrap; word-wrap: break-word; padding: 16px; margin: 0;">${content}</pre>`);
  }
}

/* Context Menu Functions */
let currentFile = null;

function showFileContextMenu(event, filename) {
  event.preventDefault();
  event.stopPropagation();
  
  currentFile = filename;
  
  let menu = document.getElementById("contextMenu");
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "contextMenu";
    document.body.appendChild(menu);
    
    document.addEventListener("click", () => {
      menu.classList.remove("show");
    });
  }
  
  menu.innerHTML = `
    <div class="context-item" onclick="deleteFile('${filename.replace(/'/g, "\\'")}')" style="color: #d32f2f;">🗑️ Delete</div>
    <div class="context-item" onclick="renameFile('${filename.replace(/'/g, "\\'")}')" style="color: #1976d2;">✏️ Rename</div>
    <div class="context-item" onclick="duplicateFile('${filename.replace(/'/g, "\\'")}')" style="color: #388e3c;">📋 Duplicate</div>
  `;
  
  menu.classList.add("show");
  menu.style.top = event.clientY + "px";
  menu.style.left = event.clientX + "px";
}

function deleteFile(filename) {
  if (confirm(`Move '${filename}' to Recycle Bin?`)) {
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    let trash = JSON.parse(localStorage.getItem("trash") || "{}");
    
    // Move file to trash
    trash[filename] = files[filename];
    delete files[filename];
    
    localStorage.setItem("files", JSON.stringify(files));
    localStorage.setItem("trash", JSON.stringify(trash));
    document.getElementById("contextMenu").classList.remove("show");
    
    // Refresh all explorer windows
    for (let id in windows) {
      if (windows[id].title === "File Explorer") {
        windows[id].element.remove();
        delete windows[id];
      }
    }
    openExplorer();
  }
}

function renameFile(filename) {
  const newName = prompt("Enter new filename:", filename);
  if (newName && newName !== filename) {
    let files = JSON.parse(localStorage.getItem("files") || "{}");
    if (files[newName]) {
      alert("File already exists!");
      return;
    }
    files[newName] = files[filename];
    delete files[filename];
    localStorage.setItem("files", JSON.stringify(files));
    document.getElementById("contextMenu").classList.remove("show");
    
    // Refresh all explorer windows
    for (let id in windows) {
      if (windows[id].title === "File Explorer") {
        windows[id].element.remove();
        delete windows[id];
      }
    }
    openExplorer();
  }
}

function duplicateFile(filename) {
  let files = JSON.parse(localStorage.getItem("files") || "{}");
  const ext = filename.lastIndexOf(".") > -1 ? filename.substring(filename.lastIndexOf(".")) : "";
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf(".") > -1 ? filename.lastIndexOf(".") : filename.length);
  let newName = nameWithoutExt + " - Copy" + ext;
  let counter = 1;
  while (files[newName]) {
    newName = nameWithoutExt + " - Copy (" + counter + ")" + ext;
    counter++;
  }
  files[newName] = files[filename];
  localStorage.setItem("files", JSON.stringify(files));
  document.getElementById("contextMenu").classList.remove("show");
  
  // Refresh all explorer windows
  for (let id in windows) {
    if (windows[id].title === "File Explorer") {
      windows[id].element.remove();
      delete windows[id];
    }
  }
  openExplorer();
}

/* Recycle Bin */
function openRecycle() {
  const trash = JSON.parse(localStorage.getItem("trash") || "{}");
  const trashList = Object.keys(trash).length > 0
    ? Object.keys(trash).map(f => {
        const escapedName = f.replace(/'/g, "\\'");
        return `<div class="file-item" oncontextmenu="showTrashContextMenu(event, '${escapedName}')">${f}</div>`;
      }).join("")
    : "<p style='color: #999; text-align: center; margin-top: 20px;'>🗑️<br><br>Recycle Bin is empty</p>";
  
  createWindow("Recycle Bin", trashList);
}

/* Recycle Bin Context Menu */
function showTrashContextMenu(event, filename) {
  event.preventDefault();
  event.stopPropagation();
  
  let menu = document.getElementById("contextMenu");
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "contextMenu";
    document.body.appendChild(menu);
    
    document.addEventListener("click", () => {
      menu.classList.remove("show");
    });
  }
  
  menu.innerHTML = `
    <div class="context-item" onclick="restoreFile('${filename.replace(/'/g, "\\'")}')" style="color: #388e3c;">↩️ Restore</div>
    <div class="context-item" onclick="permanentDeleteFile('${filename.replace(/'/g, "\\'")}')" style="color: #d32f2f;">🗑️ Delete Permanently</div>
  `;
  
  menu.classList.add("show");
  menu.style.top = event.clientY + "px";
  menu.style.left = event.clientX + "px";
}

function restoreFile(filename) {
  let files = JSON.parse(localStorage.getItem("files") || "{}");
  let trash = JSON.parse(localStorage.getItem("trash") || "{}");
  
  if (files[filename]) {
    alert("File already exists in your computer!");
    return;
  }
  
  // Move file back from trash
  files[filename] = trash[filename];
  delete trash[filename];
  
  localStorage.setItem("files", JSON.stringify(files));
  localStorage.setItem("trash", JSON.stringify(trash));
  document.getElementById("contextMenu").classList.remove("show");
  
  alert(`File '${filename}' restored!`);
  
  // Refresh recycle bin
  for (let id in windows) {
    if (windows[id].title === "Recycle Bin") {
      windows[id].element.remove();
      delete windows[id];
    }
  }
  openRecycle();
}

function permanentDeleteFile(filename) {
  if (confirm(`Permanently delete '${filename}'?`)) {
    let trash = JSON.parse(localStorage.getItem("trash") || "{}");
    delete trash[filename];
    localStorage.setItem("trash", JSON.stringify(trash));
    document.getElementById("contextMenu").classList.remove("show");
    
    // Refresh recycle bin
    for (let id in windows) {
      if (windows[id].title === "Recycle Bin") {
        windows[id].element.remove();
        delete windows[id];
      }
    }
    openRecycle();
  }
}

/* Wallpapers App */
const wallpaperColors = [
  { name: 'Ocean Blue', color: 'linear-gradient(135deg, #1e3c72, #2a5298)' },
  { name: 'Sunset', color: 'linear-gradient(135deg, #ff6b35, #f7931e)' },
  { name: 'Forest', color: 'linear-gradient(135deg, #134e5e, #71b280)' },
  { name: 'Purple Dream', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { name: 'Mint', color: 'linear-gradient(135deg, #00d084, #00a67e)' },
  { name: 'Cherry', color: 'linear-gradient(135deg, #eb3349, #f45c43)' },
  { name: 'Blueberry', color: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { name: 'Peach', color: 'linear-gradient(135deg, #fa709a, #fee140)' }
];

let selectedWallpaper = null;

function openWallpapers() {
  const colorGrid = wallpaperColors.map((wp, idx) => 
    `<div class="wallpaper-color" style="background: ${wp.color}; animation: fadeIn 0.3s ease-in-out ${idx * 0.05}s both;" onclick="previewWallpaper('${wp.color.replace(/'/g, "\\'")}')" title="${wp.name}"></div>`
  ).join('');
  
  const contentHTML = `
    <div class="wallpaper-grid fade-in">
      ${colorGrid}
    </div>
  `;
  
  createWindow("Wallpapers", contentHTML);
}

function previewWallpaper(gradient) {
  selectedWallpaper = gradient;
  document.body.style.background = gradient;
  
  // Show confirmation
  for (let id in windows) {
    if (windows[id].title === "Wallpapers") {
      const contentDiv = windows[id].element.querySelector(".content");
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; animation: fadeIn 0.4s ease;">
          <div style="font-size: 56px; margin: 0; animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);">✓</div>
          <p style="font-size: 16px; margin-top: 16px; color: #2d5016; font-weight: 600;">Wallpaper applied successfully!</p>
          <div style="margin-top: 24px; display: flex; gap: 10px; justify-content: center;">
            <button onclick="setWallpaper()" style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">✓ Save</button>
            <button onclick="cancelWallpaper()" style="padding: 10px 20px; background: rgba(0,0,0,0.1); color: #333; border: 1px solid rgba(0,0,0,0.2); border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
          </div>
        </div>
      `;
      break;
    }
  }
}

function setWallpaper() {
  if (selectedWallpaper) {
    localStorage.setItem("wallpaper", selectedWallpaper);
    
    // Close wallpapers window
    for (let id in windows) {
      if (windows[id].title === "Wallpapers") {
        windows[id].element.remove();
        delete windows[id];
        updateTaskbar();
        break;
      }
    }
  }
}

function cancelWallpaper() {
  selectedWallpaper = null;
  // Restore previous wallpaper
  const savedWallpaper = localStorage.getItem("wallpaper");
  if (savedWallpaper) {
    document.body.style.background = savedWallpaper;
  } else {
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
  openWallpapers();
}

// Load wallpaper on page load
window.addEventListener('load', () => {
  const savedWallpaper = localStorage.getItem("wallpaper");
  if (savedWallpaper) {
    document.body.style.background = savedWallpaper;
  }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes scaleIn {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
