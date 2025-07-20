const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BookNest API",
      version: "1.0.0",
      description: "API documentation for BookNest",
    },
    servers: [{ url: "https://booknest-api.vtsj.onrender.com/api" }],
    components: {
      schemas: {
        Book: {
          type: "object",
          required: [
            "title",
            "author",
            "isbn",
            "genre",
            "publishedYear",
            "pages",
            "price",
          ],
          properties: {
            title: {
              type: "string",
              example: "The Great Gatsby",
            },
            author: {
              type: "string",
              example: "F. Scott Fitzgerald",
            },
            isbn: {
              type: "string",
              example: "123-4567890123",
            },
            genre: {
              type: "string",
              example: "Fiction",
            },
            publishedYear: {
              type: "integer",
              example: 1925,
            },
            pages: {
              type: "integer",
              example: 180,
            },
            description: {
              type: "string",
              example: "A novel about the American dream.",
            },
            price: {
              type: "number",
              example: 10.99,
            },
          },
        },
        UserSignup: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" },
          },
        },
        UserLogin: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
