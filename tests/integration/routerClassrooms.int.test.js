const request = require("supertest");
const express = require("express");
const routerClassrooms = require("../../routers/routerClassrooms");
const { generateTokens } = require("../../auth");
const database = require("../../database");

const app = express();
app.use(express.json());
app.use("/classrooms", routerClassrooms);

describe("Classrooms Router Integration Tests", () => {
	let teacherToken;

	beforeAll(() => {
		const user = { id: 1, role: "teacher" };
		teacherToken = generateTokens(user).accessToken;
	});

	afterAll(() => {
		database.end();
	});

	describe("POST /classrooms", () => {
		it("should create a classroom with valid data", async () => {
			const response = await request(app)
				.post("/classrooms")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "3C" });

			expect(response.status).toBe(200);
		});

		it("should return 400 if name is empty", async () => {
			const response = await request(app)
				.post("/classrooms")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "" });

			expect(response.status).toBe(400);
		});

		it("should return 404 if classroom name already exists", async () => {

			const response = await request(app)
				.post("/classrooms")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "class1T1" });

			expect(response.status).toBe(404);
		});
	});

	describe("PUT /classrooms/:classroomName", () => {
		it("should return 404 if new classroom name already exists", async () => {

			const response = await request(app)
				.put("/classrooms/class1T1")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "class2T1" });

			expect(response.status).toBe(404);
		});
	});

	describe("GET /classrooms/list", () => {
		it("should list classrooms for a valid teacher", async () => {

			const response = await request(app)
				.get("/classrooms/list")
				.set("Authorization", `Bearer ${ teacherToken }`);

			expect(response.status).toBe(200);
		});
	});

	describe("DELETE /classrooms/:classroomName", () => {
		it("should delete a classroom with valid data", async () => {

			const response = await request(app)
				.delete("/classrooms/3C")
				.set("Authorization", `Bearer ${ teacherToken }`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ deleted: true });
		});

		it("should return 404 if classroom does not exist", async () => {
			const response = await request(app)
				.delete("/classrooms/3C")
				.set("Authorization", `Bearer ${ teacherToken }`);

			expect(response.status).toBe(404);
		});
	});
});