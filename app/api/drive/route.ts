import { NextResponse } from "next/server";
import { saveToDrive, listDriveFiles, downloadFromDrive, getFolderStructure } from "@/lib/drive";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const fileId = searchParams.get("fileId");

  try {
    if (action === "download" && fileId) {
      const { data, mimeType } = await downloadFromDrive(fileId);
      const uint8Array = new Uint8Array(data);
      return new NextResponse(uint8Array, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": "attachment",
          "Cache-Control": "no-cache",
        },
      });
    }

    if (action === "structure") {
      try {
        const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const sharedDriveName = process.env.DRIVE_SHARED_DRIVE_NAME;
        
        if (!serviceAccountKey) {
          return NextResponse.json({ 
            structure: [], 
            success: false, 
            error: "GOOGLE_SERVICE_ACCOUNT_KEY is not configured. Please set the Google Drive service account JSON key in your environment variables." 
          }, { status: 200 });
        }
        
        if (!sharedDriveName) {
          return NextResponse.json({ 
            structure: [], 
            success: false, 
            error: "DRIVE_SHARED_DRIVE_NAME is not configured. Please set the shared drive name in your environment variables." 
          }, { status: 200 });
        }

        const structure = await getFolderStructure();
        console.log("Folder structure result:", JSON.stringify(structure, null, 2));
        return NextResponse.json({ structure, success: true });
      } catch (err: any) {
        console.error("Structure error:", err);
        return NextResponse.json({ structure: [], success: false, error: err.message }, { status: 200 });
      }
    }

    if (action === "folders") {
      const { google, drive_v3 } = require("googleapis");
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountKey) {
        return NextResponse.json({ error: "Not configured", folders: [], success: false }, { status: 200 });
      }

      const key = JSON.parse(serviceAccountKey);
      const auth = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
      const drive = google.drive({ version: "v3", auth });

      const foldersResponse = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        orderBy: "name desc",
        pageSize: 100,
        fields: "files(id, name, modifiedTime)",
      });

      const folders = (foldersResponse.data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        modifiedTime: f.modifiedTime,
      }));

      return NextResponse.json({ folders, success: true });
    }

    const files = await listDriveFiles();
    return NextResponse.json({ files, success: true });
  } catch (error: any) {
    console.error("Drive API error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to access Google Drive", 
        files: [],
        structure: [],
        success: false 
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { fileData, fileName, folderName } = await request.json();

    if (!fileData || !fileName || !folderName) {
      return NextResponse.json(
        { error: "Missing required fields", success: false },
        { status: 400 }
      );
    }

    console.log("[API] Saving to Drive:", { fileName, folderName, dataLength: fileData?.length });

    const result = await saveToDrive(fileData, fileName, folderName);

    console.log("[API] Save successful:", result);

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      folderName,
      fileName,
    });
  } catch (error: any) {
    console.error("[API] Drive upload error:", error);
    console.error("[API] Error details:", error?.response?.data || error?.stack);
    return NextResponse.json(
      { error: error.message || "Failed to save to Google Drive", success: false },
      { status: 500 }
    );
  }
}
