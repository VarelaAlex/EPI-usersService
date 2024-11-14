const request = require("supertest");
const express = require("express");
const routerClassrooms = require("../../routers/routerClassrooms");
const { generateTokens } = require("../../auth");

jest.mock("../../database");
jest.mock("../../auth");

const database = require("../../database");
const { authenticateToken, isTeacher } = require("../../auth");

const app = express();
app.use(express.json());
app.use("/classrooms", routerClassrooms);

describe("Classrooms Router", () => {
	let teacherToken;

	beforeAll(() => {

		authenticateToken.mockImplementation((req, res, next) => {
			req.user = { id: 1, role: "teacher" };
			next();
		});

		isTeacher.mockImplementation((req, res, next) => {
			next();
		});

		generateTokens.mockReturnValue({
			                               accessToken: "validAccessToken", refreshToken: "validRefreshToken"
		                               });
		const user = { id: 1, role: "teacher" };
		teacherToken = generateTokens(user).accessToken;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("POST /classrooms", () => {
		it("should create a classroom with valid data", async () => {
			database.query.mockResolvedValueOnce([]);
			database.query.mockResolvedValueOnce({ insertId: 1 });

			const response = await request(app)
				.post("/classrooms")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "3C" });

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ inserted: { insertId: 1 } });
		});

		it("should return 400 if name is empty", async () => {
			const response = await request(app)
				.post("/classrooms")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "" });

			expect(response.status).toBe(400);
		});

		it("should return 404 if classroom name already exists", async () => {
			database.query.mockResolvedValueOnce([{ name: "3C" }]);

			const response = await request(app)
				.post("/classrooms")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "3C" });

			expect(response.status).toBe(404);
		});
	});

	describe("PUT /classrooms/:classroomName", () => {
		it("should update a classroom with valid data", async () => {
			database.query.mockResolvedValueOnce([]);
			database.query.mockResolvedValueOnce({ affectedRows: 1 });

			const response = await request(app)
				.put("/classrooms/3C")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "5D" });

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ updated: { affectedRows: 1 } });
		});

		it("should return 400 if classroomName is invalid", async () => {
			const response = await request(app)
				.put("/classrooms/%20") // %20 represents a space character
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "5D" });

			expect(response.status).toBe(400);
		});

		it("should return 404 if new classroom name already exists", async () => {
			database.query.mockResolvedValueOnce([{ name: "5D" }]);

			const response = await request(app)
				.put("/classrooms/3C")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "5D" });

			expect(response.status).toBe(404);
		});
	});

	describe("GET /classrooms/list", () => {
		it("should list classrooms for a valid teacher", async () => {
			database.query.mockResolvedValueOnce([
				                                     { id: 1, name: "3C", numberStudents: 10 },
				                                     { id: 2, name: "5D", numberStudents: 15 }
			                                     ]);

			const response = await request(app)
				.get("/classrooms/list")
				.set("Authorization", `Bearer ${ teacherToken }`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual([
				                              { id: 1, name: "3C", numberStudents: 10 },
				                              { id: 2, name: "5D", numberStudents: 15 }
			                              ]);
		});

		it("should return 404 if no classrooms exist", async () => {
			database.query.mockResolvedValueOnce([]);

			const response = await request(app)
				.get("/classrooms/list")
				.set("Authorization", `Bearer ${ teacherToken }`);

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /classrooms/:classroomName", () => {
		it("should delete a classroom with valid data", async () => {
			database.query.mockResolvedValueOnce({ affectedRows: 1 });

			const response = await request(app)
				.delete("/classrooms/3C")
				.set("Authorization", `Bearer ${ teacherToken }`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ deleted: true });
		});

		it("should return 404 if classroom does not exist", async () => {
			database.query.mockResolvedValueOnce({ affectedRows: 0 });

			const response = await request(app)
				.delete("/classrooms/3C")
				.set("Authorization", `Bearer ${ teacherToken }`);

			expect(response.status).toBe(404);
		});

		it("should return 400 if classroomName is invalid", async () => {
			const response = await request(app)
				.delete("/classrooms/%20") // %20 represents a space character
				.set("Authorization", `Bearer ${ teacherToken }`)

			expect(response.status).toBe(400);
		});
	});
});