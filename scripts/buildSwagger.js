/**
 * Build Swagger documentation
 */
import swaggerJsdoc from "swagger-jsdoc";
import swaggerDef from "../swagger/swaggerDef.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = swaggerDef.default || swaggerDef;
const spec = swaggerJsdoc(config);
const outputPath = path.join(__dirname, "../swagger/swagger.json");

fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log("✅ Swagger documentation built successfully!");
console.log(`📄 Output: ${outputPath}`);
console.log(`📊 Found ${Object.keys(spec.paths || {}).length} paths`);

