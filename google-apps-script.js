/**
 * Google Apps Script for SmartBoard Drive Integration
 * Deploy as Web App to handle Drive operations
 * Access: Anyone (for read), Anyone (for write) with Drive API scope
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  ROOT_FOLDER_NAME: 'SmartBoard',
  SUPPORTED_MIME_TYPES: {
    FOLDER: MimeType.FOLDER,
    PDF: 'application/pdf',
    PNG: 'image/png',
    JPEG: 'image/jpeg',
    JSON: 'application/json',
    SVG: 'image/svg+xml'
  },
  MAX_FILES_PER_FOLDER: 100,
  FILE_SORT_BY: 'modifiedTime' // 'name', 'modifiedTime', 'createdTime'
};

/**
 * Get or create the root SmartBoard folder
 * @returns {Folder} The root folder
 */
function getOrCreateRootFolder() {
  const folders = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
  
  if (folders.hasNext()) {
    return folders.next();
  }
  
  return DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
}

/**
 * Format a file object for API response
 * @param {File} file - The Drive file
 * @returns {Object} Formatted file object
 */
function formatFileObject(file) {
  return {
    id: file.getId(),
    name: file.getName(),
    mimeType: file.getMimeType(),
    size: file.getSize(),
    createdTime: file.getDateCreated().toISOString(),
    modifiedTime: file.getLastUpdated().toISOString(),
    description: file.getDescription(),
    sharingUser: file.getSharingUser()?.getEmail() || null,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${file.getId()}`,
    thumbnailUrl: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w200`
  };
}

/**
 * Format a folder object for API response
 * @param {Folder} folder - The Drive folder
 * @returns {Object} Formatted folder object
 */
function formatFolderObject(folder) {
  return {
    id: folder.getId(),
    name: folder.getName(),
    createdTime: folder.getDateCreated().toISOString(),
    modifiedTime: folder.getLastUpdated().toISOString()
  };
}

// ============================================================================
// HTTP HANDLERS
// ============================================================================

/**
 * Handle GET requests
 * @param {Event} e - The event object
 * @returns {TextOutput} JSON response
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'structure';
    
    switch (action) {
      case 'structure':
        return handleGetStructure();
      case 'list':
        return handleGetList(e);
      case 'download':
        return handleGetDownload(e);
      case 'search':
        return handleGetSearch(e);
      default:
        return createErrorResponse('Invalid action');
    }
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Handle POST requests
 * @param {Event} e - The event object
 * @returns {TextOutput} JSON response
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    switch (action) {
      case 'save':
        return handlePostSave(payload);
      case 'createFolder':
        return handlePostCreateFolder(payload);
      case 'delete':
        return handlePostDelete(payload);
      case 'rename':
        return handlePostRename(payload);
      default:
        return createErrorResponse('Invalid action');
    }
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Create an error response
 * @param {string} message - Error message
 * @returns {TextOutput} JSON error response
 */
function createErrorResponse(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      success: false, 
      error: message 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create a success response
 * @param {Object} data - Response data
 * @returns {TextOutput} JSON success response
 */
function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      success: true, 
      ...data 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// GET HANDLERS
// ============================================================================

/**
 * Get full folder structure
 * @returns {TextOutput} JSON response with folder structure
 */
function handleGetStructure() {
  const rootFolder = getOrCreateRootFolder();
  const structure = buildFolderStructure(rootFolder, 3); // Max depth of 3
  
  return createSuccessResponse({
    root: formatFolderObject(rootFolder),
    structure: structure,
    stats: getFolderStats(rootFolder)
  });
}

/**
 * Build recursive folder structure
 * @param {Folder} folder - Current folder
 * @param {number} maxDepth - Maximum depth to traverse
 * @param {number} currentDepth - Current depth
 * @returns {Object} Folder structure
 */
function buildFolderStructure(folder, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return {
      _reachedMaxDepth: true,
      folderCount: countFolders(folder),
      fileCount: countFiles(folder)
    };
  }
  
  const folders = [];
  folder.getFolders().forEach(subFolder => {
    folders.push({
      ...formatFolderObject(subFolder),
      children: buildFolderStructure(subFolder, maxDepth, currentDepth + 1).folders || []
    });
  });
  
  const files = [];
  folder.getFiles().forEach(file => {
    files.push(formatFileObject(file));
  });
  
  return {
    folders: folders,
    files: files
  };
}

/**
 * Count folders in a folder
 * @param {Folder} folder - The folder
 * @returns {number} Folder count
 */
function countFolders(folder) {
  let count = 0;
  folder.getFolders().forEach(() => count++);
  return count;
}

/**
 * Count files in a folder
 * @param {Folder} folder - The folder
 * @returns {number} File count
 */
function countFiles(folder) {
  let count = 0;
  folder.getFiles().forEach(() => count++);
  return count;
}

/**
 * Get folder statistics
 * @param {Folder} folder - The folder
 * @returns {Object} Folder stats
 */
function getFolderStats(folder) {
  let totalFiles = 0;
  let totalFolders = 0;
  let totalSize = 0;
  
  // Count root level
  folder.getFiles().forEach(file => {
    totalFiles++;
    totalSize += file.getSize();
  });
  folder.getFolders().forEach(() => totalFolders++);
  
  return {
    totalFiles: totalFiles,
    totalFolders: totalFolders,
    totalSizeBytes: totalSize,
    totalSizeFormatted: formatBytes(totalSize)
  };
}

/**
 * Format bytes to human readable
 * @param {number} bytes - Bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Handle list files request
 * @param {Event} e - The event object
 * @returns {TextOutput} JSON response
 */
function handleGetList(e) {
  const folderId = e.parameter.folderId;
  const limit = parseInt(e.parameter.limit) || CONFIG.MAX_FILES_PER_FOLDER;
  const sortBy = e.parameter.sortBy || CONFIG.FILE_SORT_BY;
  
  let folder;
  
  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (error) {
      return createErrorResponse('Folder not found');
    }
  } else {
    folder = getOrCreateRootFolder();
  }
  
  const files = [];
  folder.getFiles().forEach(file => {
    files.push(formatFileObject(file));
  });
  
  // Sort files
  files.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'createdTime':
        return new Date(b.createdTime) - new Date(a.createdTime);
      case 'modifiedTime':
      default:
        return new Date(b.modifiedTime) - new Date(a.modifiedTime);
    }
  });
  
  // Get subfolders
  const folders = [];
  folder.getFolders().forEach(subFolder => {
    folders.push(formatFolderObject(subFolder));
  });
  
  return createSuccessResponse({
    folder: formatFolderObject(folder),
    folders: folders,
    files: files.slice(0, limit),
    totalFiles: files.length,
    hasMore: files.length > limit
  });
}

/**
 * Handle download file request
 * @param {Event} e - The event object
 * @returns {Blob|TextOutput} File blob or error
 */
function handleGetDownload(e) {
  const fileId = e.parameter.fileId;
  
  if (!fileId) {
    return createErrorResponse('File ID required');
  }
  
  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    
    return ContentService
      .createTextOutput(blob.getDataAsString())
      .setMimeType(blob.getContentType())
      .downloadAsFile(file.getName());
      
  } catch (error) {
    return createErrorResponse('File not found');
  }
}

/**
 * Handle search request
 * @param {Event} e - The event object
 * @returns {TextOutput} JSON response
 */
function handleGetSearch(e) {
  const query = e.parameter.q;
  const mimeType = e.parameter.mimeType;
  
  if (!query) {
    return createErrorResponse('Search query required');
  }
  
  const searchQuery = `name contains '${query}'`;
  const mimeQuery = mimeType ? ` and mimeType='${mimeType}'` : '';
  
  const files = [];
  const searchResults = DriveApp.searchFiles(searchQuery + mimeQuery);
  
  let count = 0;
  while (searchResults.hasNext() && count < CONFIG.MAX_FILES_PER_FOLDER) {
    const file = searchResults.next();
    files.push(formatFileObject(file));
    count++;
  }
  
  return createSuccessResponse({
    query: query,
    results: files,
    totalResults: files.length
  });
}

// ============================================================================
// POST HANDLERS
// ============================================================================

/**
 * Handle save file request
 * @param {Object} payload - Request payload
 * @returns {TextOutput} JSON response
 */
function handlePostSave(payload) {
  const { name, content, mimeType, folderId, description } = payload;
  
  if (!name || !content) {
    return createErrorResponse('Name and content required');
  }
  
  try {
    const folder = folderId 
      ? DriveApp.getFolderById(folderId) 
      : getOrCreateRootFolder();
    
    // Determine mime type
    let fileMimeType = mimeType || 'text/plain';
    if (name.endsWith('.png')) fileMimeType = 'image/png';
    else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) fileMimeType = 'image/jpeg';
    else if (name.endsWith('.json')) fileMimeType = 'application/json';
    else if (name.endsWith('.pdf')) fileMimeType = 'application/pdf';
    
    // Create blob from content
    const blob = Utilities.newBlob(content, fileMimeType, name);
    
    // Create file
    const file = folder.createFile(blob);
    
    if (description) {
      file.setDescription(description);
    }
    
    return createSuccessResponse({
      file: formatFileObject(file),
      message: 'File saved successfully'
    });
    
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Handle create folder request
 * @param {Object} payload - Request payload
 * @returns {TextOutput} JSON response
 */
function handlePostCreateFolder(payload) {
  const { name, parentFolderId } = payload;
  
  if (!name) {
    return createErrorResponse('Folder name required');
  }
  
  try {
    let parentFolder;
    
    if (parentFolderId) {
      parentFolder = DriveApp.getFolderById(parentFolderId);
    } else {
      parentFolder = getOrCreateRootFolder();
    }
    
    // Check if folder already exists
    const existing = parentFolder.getFoldersByName(name);
    if (existing.hasNext()) {
      return createSuccessResponse({
        folder: formatFolderObject(existing.next()),
        message: 'Folder already exists'
      });
    }
    
    const newFolder = parentFolder.createFolder(name);
    
    return createSuccessResponse({
      folder: formatFolderObject(newFolder),
      message: 'Folder created successfully'
    });
    
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Handle delete file/folder request
 * @param {Object} payload - Request payload
 * @returns {TextOutput} JSON response
 */
function handlePostDelete(payload) {
  const { id, type } = payload;
  
  if (!id) {
    return createErrorResponse('ID required');
  }
  
  try {
    if (type === 'folder') {
      const folder = DriveApp.getFolderById(id);
      folder.setTrashed(true);
    } else {
      const file = DriveApp.getFileById(id);
      file.setTrashed(true);
    }
    
    return createSuccessResponse({
      message: 'Successfully moved to trash'
    });
    
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Handle rename file/folder request
 * @param {Object} payload - Request payload
 * @returns {TextOutput} JSON response
 */
function handlePostRename(payload) {
  const { id, name } = payload;
  
  if (!id || !name) {
    return createErrorResponse('ID and name required');
  }
  
  try {
    const file = DriveApp.getFileById(id);
    file.setName(name);
    
    return createSuccessResponse({
      file: formatFileObject(file),
      message: 'File renamed successfully'
    });
    
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

// ============================================================================
// TEST FUNCTIONS (Run these from Apps Script editor)
// ============================================================================

/**
 * Test: Get full structure
 */
function testGetStructure() {
  console.log(handleGetStructure().getContent());
}

/**
 * Test: List files in root
 */
function testListFiles() {
  console.log(handleGetList({ parameter: {} }).getContent());
}

/**
 * Test: Create a folder
 */
function testCreateFolder() {
  const result = handlePostCreateFolder({ 
    name: 'Test Folder ' + new Date().toISOString() 
  });
  console.log(result.getContent());
}

/**
 * Test: Save a file
 */
function testSaveFile() {
  const result = handlePostSave({
    name: 'test.txt',
    content: 'Hello from SmartBoard!',
    description: 'Test file created at ' + new Date().toISOString()
  });
  console.log(result.getContent());
}
