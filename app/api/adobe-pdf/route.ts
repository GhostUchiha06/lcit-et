import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { imageData, fileName } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: "No image data provided" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Create PDF using pdf-lib (lightweight alternative that works serverless)
    const { PDFDocument, rgb } = await import("pdf-lib");

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape

    const pngImage = await pdfDoc.embedPng(imageBuffer);
    const pngDims = pngImage.size();

    // Fit image to page while maintaining aspect ratio
    const pageWidth = page.getWidth() - 40;
    const pageHeight = page.getHeight() - 40;
    const scale = Math.min(pageWidth / pngDims.width, pageHeight / pngDims.height);
    const scaledWidth = pngDims.width * scale;
    const scaledHeight = pngDims.height * scale;

    // Center the image
    const x = (page.getWidth() - scaledWidth) / 2;
    const y = (page.getHeight() - scaledHeight) / 2;

    page.drawImage(pngImage, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName || "smartboard.pdf"}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export PDF" },
      { status: 500 }
    );
  }
}
