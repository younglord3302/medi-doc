const request = require("supertest");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} = require("./setupTestDB");
const app = require("../server");
const User = require("../models/User");

describe("Auth API connectivity", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it("registers a new user and returns token + user (no password)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Test",
        lastName: "Admin",
        email: "admin@test.com",
        password: "Password123!",
        role: "admin",
      })
      .expect(201);

    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("user");
    expect(res.body.data.user).toMatchObject({
      firstName: "Test",
      lastName: "Admin",
      email: "admin@test.com",
      role: "admin",
    });
    expect(res.body.data.user).not.toHaveProperty("password");

    const userInDb = await User.findOne({ email: "admin@test.com" });
    expect(userInDb).not.toBeNull();
  });

  it("logs in existing user and returns JWT", async () => {
    await request(app).post("/api/auth/register").send({
      firstName: "Doc",
      lastName: "User",
      email: "doctor@test.com",
      password: "Password123!",
      role: "doctor",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "doctor@test.com",
        password: "Password123!",
      })
      .expect(200);

    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("user");
    expect(res.body.data.user.email).toBe("doctor@test.com");
  });

  it("blocks /me without token and allows with token", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      firstName: "Test",
      lastName: "User",
      email: "user@test.com",
      password: "Password123!",
      role: "doctor",
    });

    const token = reg.body.token;

    await request(app).get("/api/auth/me").expect(401);

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(me.body.data.user.email).toBe("user@test.com");
  });
});
