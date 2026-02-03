"server-only";

import { promises as fs } from "fs";
import path from "path";

export async function saveFile(file: File, folder: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const originalName = file.name.replace(/\s+/g, "-").toLowerCase();
  const ext = path.extname(originalName) || ".bin";
  const baseName = path.basename(originalName, ext);
  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${baseName}${ext}`;

  const absoluteFolder = path.join(process.cwd(), "public", folder);
  await fs.mkdir(absoluteFolder, { recursive: true });

  const filePath = path.join(absoluteFolder, filename);
  await fs.writeFile(filePath, buffer);

  return `/${folder}/${filename}`;
}
