import { createSwaggerSpec } from "next-swagger-doc";

export async function GET() {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: { title: "SMS API", version: "1.0.0" },
      servers: [{ url: "/api" }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });
  return Response.json(spec);
} 