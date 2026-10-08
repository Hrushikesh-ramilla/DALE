import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const root = () =>
  path.resolve(process.env.LOCAL_DATA_DIR || ".data", "assets");
export function evidenceHash(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}
export function validateImage(bytes: Buffer, mime: string) {
  if (bytes.length > 4 * 1024 * 1024 || !bytes.length)
    throw new Error("Evidence images must be between 1 byte and 4 MB.");
  const valid =
    mime === "image/png"
      ? bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : mime === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : mime === "image/webp"
          ? bytes.subarray(0, 4).toString() === "RIFF" &&
            bytes.subarray(8, 12).toString() === "WEBP"
          : false;
  if (!valid)
    throw new Error(
      "Use a PNG, JPEG, or WebP image with a matching file type.",
    );
}
export const MAX_EVIDENCE_VIDEO_BYTES = 8 * 1024 * 1024;
export function validateEvidenceMedia(bytes: Buffer, mime: string) {
  if (mime.startsWith("image/")) return validateImage(bytes, mime);
  if (!bytes.length || bytes.length > MAX_EVIDENCE_VIDEO_BYTES)
    throw new Error("Evidence videos must be between 1 byte and 8 MB.");
  const mp4 =
    mime === "video/mp4" &&
    bytes.length >= 16 &&
    bytes.subarray(4, 8).toString("ascii") === "ftyp" &&
    bytes.readUInt32BE(0) >= 16 &&
    bytes.readUInt32BE(0) <= bytes.length &&
    ["isom", "iso2", "mp41", "mp42", "avc1", "M4V "].includes(
      bytes.subarray(8, 12).toString("ascii"),
    );
  const webm =
    mime === "video/webm" &&
    bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) &&
    bytes
      .subarray(4, 4096)
      .includes(Buffer.from([0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d]));
  if (!mp4 && !webm)
    throw new Error(
      "Use a PNG, JPEG, WebP image or MP4/WebM video with a matching file type.",
    );
  // Container signatures limit accepted uploads; they are not a decoder or proof of playable, honest footage.
}
function client() {
  if (
    !process.env.S3_BUCKET ||
    !process.env.S3_ACCESS_KEY_ID ||
    !process.env.S3_SECRET_ACCESS_KEY
  )
    throw new Error("Private evidence storage is not configured.");
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || "us-east-1",
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
}
function localPath(key: string) {
  if (!/^[a-zA-Z0-9\-/]+$/.test(key) || key.includes(".."))
    throw new Error("Invalid evidence key");
  const target = path.resolve(root(), key);
  if (!target.startsWith(root() + path.sep))
    throw new Error("Invalid evidence key");
  return target;
}
export async function putAsset(key: string, bytes: Buffer, mime: string) {
  validateEvidenceMedia(bytes, mime);
  if (process.env.STORAGE_MODE === "s3")
    await client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: mime,
      }),
    );
  else {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_LOCAL_STORAGE !== "true"
    )
      throw new Error("S3 evidence storage is required for deployment.");
    const file = localPath(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes, { flag: "wx" });
  }
}
export async function getAsset(key: string, expectedHash: string) {
  const bytes =
    process.env.STORAGE_MODE === "s3"
      ? Buffer.from(
          await (
            await client().send(
              new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
            )
          ).Body!.transformToByteArray(),
        )
      : await readFile(localPath(key));
  if (evidenceHash(bytes) !== expectedHash)
    throw new Error("Evidence integrity verification failed.");
  return bytes;
}
