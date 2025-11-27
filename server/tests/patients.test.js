const request = require("supertest");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} = require("./setupTestDB");
const app = require("../server");
const Patient = require("../models/Patient");

async function createAndLoginUser(role = "doctor") {
  const email = `${role}${Date.now()}@test.com`;

  await request(app).post("/api/auth/register").send({
    firstName: role,
    lastName: "User",
    email,
    password: "Password123!",
    role,
  });

  const loginRes = await request(app).post("/api/auth/login").send({
    email,
    password: "Password123!",
  });

  return loginRes.body.token;
}

describe("Patients API connectivity", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it("rejects unauthenticated access to /api/patients", async () => {
    await request(app).get("/api/patients").expect(401);
  });

  it("allows authenticated user to create and list patients", async () => {
    const token = await createAndLoginUser("doctor");

    const createRes = await request(app)
      .post("/api/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "John",
        lastName: "Doe",
        age: 35,
        gender: "male",
        phone: "9999999999",
        email: "john.doe@test.com",
        diagnosis: "Hypertension",
      })
      .expect(201);

    expect(createRes.body).toHaveProperty("_id");
    expect(createRes.body.firstName).toBe("John");

    const listRes = await request(app)
      .get("/api/patients")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(listRes.body).toHaveProperty("data");
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body).toHaveProperty("pagination");
    expect(listRes.body.pagination.page).toBe(1);
    expect(listRes.body.pagination.total).toBe(1);
  });

  it("updates a patient and returns new data", async () => {
    const token = await createAndLoginUser("doctor");

    const createRes = await request(app)
      .post("/api/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "Jane",
        lastName: "Doe",
        age: 30,
        gender: "female",
        phone: "8888888888",
        email: "jane.doe@test.com",
        diagnosis: "Diabetes",
      });

    const patientId = createRes.body._id;

    const updateRes = await request(app)
      .put(`/api/patients/${patientId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        diagnosis: "Type 2 Diabetes",
      })
      .expect(200);

    expect(updateRes.body.diagnosis).toBe("Type 2 Diabetes");
  });

  it("deletes a patient when allowed", async () => {
    const token = await createAndLoginUser("admin");

    const createRes = await request(app)
      .post("/api/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "Mark",
        lastName: "Smith",
        age: 40,
        gender: "male",
        phone: "7777777777",
        email: "mark.smith@test.com",
        diagnosis: "Asthma",
      });

    const patientId = createRes.body._id;

    await request(app)
      .delete(`/api/patients/${patientId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const inDb = await Patient.findById(patientId);
    expect(inDb).toBeNull();
  });
});
