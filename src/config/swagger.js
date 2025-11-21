/**
 * Swagger Configuration
 */
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import swaggerDef from "../../swagger/swaggerDef.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load pre-built swagger.json, fallback to building on the fly
let swaggerSpec;
const swaggerJsonPath = path.join(__dirname, "../../swagger/swagger.json");

try {
  if (fs.existsSync(swaggerJsonPath)) {
    const swaggerJson = JSON.parse(fs.readFileSync(swaggerJsonPath, "utf8"));
    swaggerSpec = swaggerJson;
  } else {
    // Build swagger spec on the fly
    swaggerSpec = swaggerJsdoc(swaggerDef);
  }
} catch (error) {
  console.warn("Could not load swagger.json, building on the fly:", error.message);
  swaggerSpec = swaggerJsdoc(swaggerDef);
}

const swaggerOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Course An Ninh Mang API Documentation",
};

export { swaggerSpec, swaggerUi, swaggerOptions };

