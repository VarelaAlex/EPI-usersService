const request = require("supertest");
const express = require("express");
const routerTeachers = require("../../routers/routerTeacher");
const { generateTokens } = require("../../auth");
const database = require("../../database");

const app = express();
app.use(express.json());
app.use("/teachers", routerTeachers);

describe("Teachers Router", () => {

	let teacherToken;
	let teacherId;

	beforeAll(() => {
		const user = { id: 1, role: "teacher" };
		teacherToken = generateTokens(user).accessToken;
	});

	afterAll(async () => {

		await database.query("DELETE FROM teachers WHERE id = ?", [teacherId]);
		database.end();
	});

	describe("POST /teachers", () => {
		it("should create a teacher with valid data", async () => {
			const response = await request(app)
				.post("/teachers")
				.send({ name: "Test", lastName: "Test", email: "test@email.com", password: "password123" });

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("inserted");
			teacherId = response.body.inserted.insertId;
		});

		it("should return 404 if email already exists", async () => {
			const response = await request(app)
				.post("/teachers")
				.send({ name: "Test", lastName: "Test", email: "email1@email.com", password: "password123" });

			expect(response.status).toBe(404);
		});
	});

	describe("POST /teachers/login", () => {
		it("should login a teacher with valid credentials", async () => {
			const response = await request(app)
				.post("/teachers/login")
				.send({ email: "test@email.com", password: "password123" });

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("accessToken");
			expect(response.body).toHaveProperty("refreshToken");
			expect(response.body).toHaveProperty("name", "Test");
			teacherToken = response.body.accessToken;
		});

		it("should return 404 if email does not exist", async () => {
			const response = await request(app)
				.post("/teachers/login")
				.send({ email: "test2@email.com", password: "password123" });

			expect(response.status).toBe(404);
		});

		it("should return 401 if password is incorrect", async () => {
			const response = await request(app)
				.post("/teachers/login")
				.send({ email: "test@email.com", password: "wrongpassword" });

			expect(response.status).toBe(401);
		});
	});

	describe("GET /teachers/profile", () => {
		it("should get the teacher profile", async () => {
			const response = await request(app)
				.get("/teachers/profile")
				.set("Authorization", `Bearer ${ teacherToken }`);

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("name", "Test");
			expect(response.body).toHaveProperty("lastName", "Test");
			expect(response.body).toHaveProperty("email", "test@email.com");
		});
	});

	describe("PUT /teachers/profile", () => {
		it("should update the teacher profile with valid data", async () => {
			const response = await request(app)
				.put("/teachers/profile")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "Test2", lastName: "Test2", email: "test@email.com" });

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("updated");
		});

		it("should return 404 if email already exists", async () => {
			const response = await request(app)
				.put("/teachers/profile")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "Test", lastName: "Test", email: "email1@email.com", password: "password123" });
			expect(response.status).toBe(404);
			expect(response.body.error.email).toBe("profile.error.email.repeated");
		});
	});
});