import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const root = () => path.resolve(process.env.LOCAL_DATA_DIR || ".data", "assets");
export function evidenceHash(bytes: Buffer) { return createHash("sha256").update(bytes).digest("hex"); }
export function validateImage(bytes: Buffer, mime: string) {
  if (bytes.length > 4 * 1024 * 1024 || !bytes.length) throw new Error("Evidence images must be between 1 byte and 4 MB.");
  const valid = mime === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : mime === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : mime === "image/webp" ? bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP" : false;
  if (!valid) throw new Error("Use a PNG, JPEG, or WebP image with a matching file type.");
}
function client() {
  if (!process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) throw new Error("Private evidence storage is not configured.");
  return new S3Client({ endpoint: process.env.S3_ENDPOINT || undefined, region: process.env.S3_REGION || "us-east-1", forcePathStyle: Boolean(process.env.S3_ENDPOINT), credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } });
}
function localPath(key: string) { if (!/^[a-zA-Z0-9\-/]+$/.test(key) || key.includes("..")) throw new Error("Invalid evidence key"); const target = path.resolve(root(), key); if (!target.startsWith(root() + path.sep)) throw new Error("Invalid evidence key"); return target; }
export async function putAsset(key: string, bytes: Buffer, mime: string) {
  validateImage(bytes, mime);
  if (process.env.STORAGE_MODE === "s3") await client().send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: bytes, ContentType: mime }));
  else { if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_STORAGE !== "true") throw new Error("S3 evidence storage is required for deployment."); const file = localPath(key); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, bytes, { flag: "wx" }); }
}
export async function getAsset(key: string, expectedHash: string) {
  const bytes = process.env.STORAGE_MODE === "s3" ? Buffer.from(await (await client().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }))).Body!.transformToByteArray()) : await readFile(localPath(key));
  if (evidenceHash(bytes) !== expectedHash) throw new Error("Evidence integrity verification failed."); return bytes;
}
