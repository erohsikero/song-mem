import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GENERATED_DIR = process.env.GENERATED_DIR || "./generated";

export async function generateImage(prompt: string): Promise<string> {
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  const response = await openai.images.generate({
    model,
    prompt,
    n: 1,
    size: "1024x1024",
  });

  const imageData = response.data?.[0];
  if (!imageData) {
    throw new Error("No image data returned from OpenAI");
  }

  const filename = `${uuidv4()}.png`;
  const dir = path.resolve(GENERATED_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, filename);

  if (imageData.b64_json) {
    const buffer = Buffer.from(imageData.b64_json, "base64");
    fs.writeFileSync(filePath, buffer);
  } else if (imageData.url) {
    const res = await fetch(imageData.url);
    const arrayBuf = await res.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuf));
  } else {
    throw new Error("No image URL or base64 data in response");
  }

  return `/generated/${filename}`;
}
