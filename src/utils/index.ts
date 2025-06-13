import path from "node:path";

export function withExtension(filePath: string, extension: string) {
  return path.parse(filePath).name + `.${extension}`;
}
