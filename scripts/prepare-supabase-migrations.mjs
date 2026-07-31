import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "database");
const target = path.join(root, "supabase", "migrations");
const prefix = "20260731";

await mkdir(target, { recursive: true });
for (const file of await readdir(target)) {
  if (/^20260731\d{4}_\d{3}_.+\.sql$/.test(file)) await rm(path.join(target, file));
}
const migrations = (await readdir(source)).filter((file) => /^\d{3}_.+\.sql$/.test(file)).sort();
for (const [index, file] of migrations.entries()) {
  const sequence = String(index + 1).padStart(4, "0");
  await copyFile(path.join(source, file), path.join(target, `${prefix}${sequence}_${file}`));
}
console.log(`Prepared ${migrations.length} migrations in ${path.relative(root, target)}.`);
