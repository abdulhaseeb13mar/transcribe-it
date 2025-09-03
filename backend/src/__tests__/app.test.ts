import request from "supertest";
import app from "../index";
import { describe, it } from "node:test";

describe("Health Check", () => {
  it("should return 200 and health status", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toHaveProperty("status", "OK");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("uptime");
    expect(response.body).toHaveProperty("environment");
  });
});

describe("API Info", () => {
  it("should return API information", async () => {
    const response = await request(app).get("/api").expect(200);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message", "Transcribe It API");
    expect(response.body).toHaveProperty("version", "1.0.0");
    expect(response.body).toHaveProperty("endpoints");
  });
});

describe("404 Handler", () => {
  it("should return 404 for unknown routes", async () => {
    const response = await request(app).get("/unknown-route").expect(404);

    expect(response.body).toHaveProperty("success", false);
    expect(response.body.error).toHaveProperty("message");
  });
});
