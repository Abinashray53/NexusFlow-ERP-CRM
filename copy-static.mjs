import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const source = resolve("src/db/schema.sql");
const destination = resolve("dist/db/schema.sql");

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
