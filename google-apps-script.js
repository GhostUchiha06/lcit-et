// Google Apps Script for SmartBoard Drive Integration
// Deploy this script as a web app to handle Drive operations

const FOLDER_NAME = 'SmartBoard-Exports';

// Create folder with date name
function getOrCreateFolder(dateStr) {
  const folders = DriveApp.getFoldersByName(dateStr);
  
  if (folders.hasNext()) {
    return folders.next();
  }
  
  return DriveApp.createFolder(dateStr);
}

// Handle GET requests
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'list') {
    return listFiles();
  }
  
  if (action === 'download' && e.parameter.fileId) {
    return downloadFile(e.parameter.fileId);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests
function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const action = payload.action;
  
  if (action === 'save') {
    return saveFile(payload);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// List all PDF and PNG files
function listFiles() {
  try {
    const files = [];
    
    // Get files from root
    const rootFiles = DriveApp.getFiles();
    while (rootFiles.hasNext()) {
      const file = rootFiles.next();
      const mimeType = file.getMimeType();
      
      if (mimeType === 'application/pdf' || mimeType === 'image/png') {
        files.push({
          id: file.getId(),
          name: file.getName(),
          mimeType: mimeType,
          modifiedTime: file.getLastUpdated().toISOString()
        });
      }
    }
    
    // Also search in subfolders named with dates
    const folders = DriveApp.getFolders();
    while (folders.hasNext()) {
      const folder = folders.next();
      const folderFiles = folder.getFiles();
      
      while (folderFiles.hasNext()) {
        const file = folderFiles.next();
        const mimeType = file.getMimeType();
        
        if (mimeType === 'application/pdf' || mimeType === 'image/png') {
          files.push({
            id: file.getId(),
            name: file.getName(),
            mimeType: mimeType,
            modifiedTime: file.getLastUpdated().toISOString()
          });
        }
      }
    }
    
    // Sort by modification time descending
    files.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
    
    return ContentService.createTextOutput(JSON.stringify({ files: files.slice(0, 50) }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Download a file
function downloadFile(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    
    return blob.getAs(blob.getContentType())
      .setName(file.getName());
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Save a file
