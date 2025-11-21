/**
 * Swagger Definition
 */
import dotenv from "dotenv";
dotenv.config();

export default {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Course An Ninh Mang API",
      version: "1.0.0",
      description: "API documentation for Course An Ninh Mang backend",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:8000",
        description: "Development server",
      },
      {
        url: "https://course-an-ninh-mang-backend.vercel.app",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            error_code: {
              type: "integer",
              example: 0,
            },
            message: {
              type: "string",
              example: "Success",
            },
            data: {
              type: "object",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error_code: {
              type: "integer",
              example: 40001,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            data: {
              type: "object",
              nullable: true,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

