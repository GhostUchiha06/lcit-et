import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  isFolder?: boolean;
}

interface FolderStructure {
  name: string;
  id: string;
  files: DriveFile[];
  subfolders: FolderStructure[];
}

function getDriveClient(): drive_v3.Drive {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not configured");
  }

  const key = JSON.parse(serviceAccountKey);

  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

export async function saveToDrive(
  fileData: string,
  fileName: string,
  folderName: string
): Promise<{ fileId: string; folderId: string }> {
  const drive = getDriveClient();

  // Get the shared drive ID from environment variable
  const sharedDriveName = process.env.DRIVE_SHARED_DRIVE_NAME;
  if (!sharedDriveName) {
    throw new Error("DRIVE_SHARED_DRIVE_NAME is not set in environment variables");
  }

  // Find the shared drive by name
  const driveList = await drive.drives.list();
  const sharedDrive = driveList.data.drives?.find(d => d.name === sharedDriveName);
  if (!sharedDrive) {
    throw new Error(`Shared drive "${sharedDriveName}" not found or not accessible to the service account`);
  }
  const sharedDriveId = sharedDrive.id as string;

  // Look for existing folder in the shared drive
  const folderResponse = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: "drive" as const,
    driveId: sharedDriveId,
    fields: "files(id, name)",
  });

  let folderId: string = "";
  if (folderResponse.data.files && folderResponse.data.files.length > 0) {
    folderId = folderResponse.data.files[0].id!;
  } else {
    // Create folder in the shared drive
    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [sharedDriveId],
      },
      supportsAllDrives: true,
    });
    folderId = folder.data.id!;
  }

  const buffer = Buffer.from(fileData, "base64");
  const readable = Readable.from(buffer);

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: "image/png",
      body: readable,
    },
    supportsAllDrives: true,
  });

  return { fileId: file.data.id!, folderId };
}

export async function listDriveFiles(): Promise<DriveFile[]> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: "mimeType contains 'image' and trashed=false",
    orderBy: "modifiedTime desc",
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    fields: "files(id, name, mimeType, modifiedTime)",
  });

  return (response.data.files || []).map((file: drive_v3.Schema$File) => ({
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType!,
    modifiedTime: file.modifiedTime!,
  }));
}

export async function getFolderStructure(): Promise<FolderStructure[]> {
  const drive = getDriveClient();
  const result: FolderStructure[] = [];

  const fetchFoldersInDrive = async (corpora: "drive" | "user", driveId?: string) => {
    const foldersResponse = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      orderBy: "name desc",
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora,
      driveId,
      fields: "files(id, name, modifiedTime)",
    });
    return foldersResponse.data.files || [];
  };

  const fetchFilesInFolder = async (folderId: string, corpora: "drive" | "user", driveId?: string) => {
    const filesResponse = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      orderBy: "modifiedTime desc",
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora,
      driveId,
      fields: "files(id, name, mimeType, modifiedTime)",
    });

    return (filesResponse.data.files || [])
      .filter((f: drive_v3.Schema$File) => 
        f.mimeType?.includes("image") || f.mimeType?.includes("pdf")
      )
      .map((file: drive_v3.Schema$File) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        modifiedTime: file.modifiedTime!,
      }));
  };

  try {
    const sharedDriveName = process.env.DRIVE_SHARED_DRIVE_NAME;
    let sharedDriveId: string | undefined;
    
    if (sharedDriveName) {
      try {
        const driveList = await drive.drives.list();
        const sharedDrive = driveList.data.drives?.find(d => d.name === sharedDriveName);
        if (sharedDrive) {
          sharedDriveId = sharedDrive.id as string;
        }
      } catch (err) {
        console.log("[Drive] Could not list drives:", err);
      }
    }

    let folders: drive_v3.Schema$File[] = [];

    if (sharedDriveId) {
      console.log("[Drive] Searching in shared drive:", sharedDriveId);
      folders = await fetchFoldersInDrive("drive", sharedDriveId);
    }

    if (folders.length === 0) {
      console.log("[Drive] Searching in user drive...");
      folders = await fetchFoldersInDrive("user");
    }

    console.log("[Drive] Found folders:", folders.length);
    
    if (folders.length === 0) {
      return [];
    }

    for (const folder of folders) {
      const folderId = folder.id!;
      const folderName = folder.name!;
      const corpora = sharedDriveId ? "drive" : "user";

      const files = await fetchFilesInFolder(folderId, corpora, sharedDriveId);

      result.push({
        name: folderName,
        id: folderId,
        files,
        subfolders: [],
      });
    }
  } catch (error) {
    console.error("Error getting folder structure:", error);
    throw error;
  }

  return result;
}

export async function downloadFromDrive(
  fileId: string
): Promise<{ data: Buffer; mimeType: string }> {
  const drive = getDriveClient();

  const fileInfo = await drive.files.get({
    fileId,
    fields: "mimeType, name",
  });

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );

  return {
    data: Buffer.from(response.data as ArrayBuffer),
    mimeType: fileInfo.data.mimeType || "application/octet-stream",
  };
}