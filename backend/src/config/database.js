// O armazenamento de produção desta aplicação é o Supabase/PostgreSQL.
// Estes helpers permanecem somente para compatibilidade com versões antigas
// do projeto; os models atuais não gravam mais dados em JSON.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");

function filePath(fileName) { return path.join(DATA_DIR, fileName); }
function readJSON(fileName) {
  const full = filePath(fileName);
  if (!fs.existsSync(full)) return [];
  const raw = fs.readFileSync(full, "utf-8").trim();
  return raw ? JSON.parse(raw) : [];
}
function writeJSON(fileName, data) {
  fs.writeFileSync(filePath(fileName), JSON.stringify(data, null, 2), "utf-8");
}
export { readJSON, writeJSON };
