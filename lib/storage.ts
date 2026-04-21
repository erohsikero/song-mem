import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function saveUploadedFile(
  buffer: Buffer,
  originalName: string
): { storedPath: string; storedFilename: string } {
  const dir = path.resolve(UPLOAD_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const ext = path.extname(originalName);
  const storedFilename = `${uuidv4()}${ext}`;
  const storedPath = path.join(dir, storedFilename);

  fs.writeFileSync(storedPath, buffer);

  return { storedPath, storedFilename };
}

export function getUploadPath(filename: string): string {
  return path.resolve(UPLOAD_DIR, filename);
}
