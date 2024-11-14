const request = require("supertest");
const express = require("express");
const bcrypt = require("bcryptjs");
const routerTeachers = require("../../routers/routerTeacher");
const { generateTokens } = require("../../auth");

jest.mock("../../database");
jest.mock("../../auth");
jest.mock("bcryptjs");

const database = require("../../database");
const { authenticateToken, isTeacher } = require("../../auth");

const app = express();
app.use(express.json());
app.use("/teachers", routerTeachers);

describe("Teachers Router", () => {
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
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("POST /teachers", () => {
		it("should create a teacher with valid data", async () => {
			database.query.mockResolvedValueOnce([]);
			database.query.mockResolvedValueOnce({ insertId: 1 });

			const response = await request(app)
				.post("/teachers")
				.send({ name: "Angelica", lastName: "Ross", email: "aross1@email.com", password: "password123" });

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("inserted");
		});

		it("should return 400 if name is empty", async () => {
			const response = await request(app)
				.post("/teachers")
				.send({ name: "", lastName: "Ross", email: "aross1@email.com", password: "password123" });

			expect(response.status).toBe(400);
		});

		it("should return 400 if lastName is empty", async () => {
			const response = await request(app)
				.post("/teachers")
				.send({ name: "Angelica", lastName: "", email: "aross1@email.com", password: "password123" });

			expect(response.status).toBe(400);
		});

		it("should return 400 if email is empty", async () => {
			const response = await request(app)
				.post("/teachers")
				.send({ name: "Angelica", lastName: "Ross", email: "", password: "password123" });

			expect(response.status).toBe(400);
		});

		it("should return 400 if password is empty", async () => {
			const response = await request(app)
				.post("/teachers")
				.send({ name: "Angelica", lastName: "Ross", email: "aross1@email.com", password: "" });

			expect(response.status).toBe(400);
		});

		it("should return 400 if email format is invalid", async () => {
			const response = await request(app)
				.post("/teachers")
				.send({ name: "Angelica", lastName: "Ross", email: "invalid-email", password: "password123" });

			expect(response.status).toBe(400);
		});

		it("should return 404 if email already exists", async () => {
			database.query.mockResolvedValueOnce([{ email: "aross1@email.com" }]);

			const response = await request(app)
				.post("/teachers")
				.send({ name: "Angelica", lastName: "Ross", email: "aross1@email.com", password: "password123" });

			expect(response.status).toBe(404);
		});
	});

	describe("POST /teachers/login", () => {
		it("should login a teacher with valid credentials", async () => {
			database.query.mockResolvedValueOnce([{ email: "aross1@email.com" }]);
			database.query.mockResolvedValueOnce([
				                                     {
					                                     id:       1,
					                                     email:    "aross1@email.com",
					                                     name:     "Angelica",
					                                     password: "hashedpassword"
				                                     }
			                                     ]);
			bcrypt.compare = jest.fn().mockResolvedValue(true);

			const response = await request(app)
				.post("/teachers/login")
				.send({ email: "aross1@email.com", password: "password123" });

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("accessToken");
			expect(response.body).toHaveProperty("refreshToken");
			expect(response.body).toHaveProperty("name", "Angelica");
		});

		it("should return 400 if email is empty", async () => {
			const response = await request(app)
				.post("/teachers/login")
				.send({ email: "", password: "password123" });

			expect(response.status).toBe(400);
		});

		it("should return 400 if password is empty", async () => {
			const response = await request(app)
				.post("/teachers/login")
				.send({ email: "aross1@email.com", password: "" });

			expect(response.status).toBe(400);
		});

		it("should return 404 if email does not exist", async () => {
			database.query.mockResolvedValueOnce([]);

			const response = await request(app)
				.post("/teachers/login")
				.send({ email: "alovelace2@email.com", password: "password123" });

			expect(response.status).toBe(404);
		});

		it("should return 401 if password is incorrect", async () => {
			database.query.mockResolvedValueOnce([{ email: "aross1@email.com" }]);
			database.query.mockResolvedValueOnce([
				                                     {
					                                     id:       1,
					                                     email:    "aross1@email.com",
					                                     name:     "Angelica",
					                                     password: "hashedpassword"
				                                     }
			                                     ]);
			bcrypt.compare = jest.fn().mockResolvedValue(false);

			const response = await request(app)
				.post("/teachers/login")
				.send({ email: "aross1@email.com", password: "wrongpassword" });

			expect(response.status).toBe(401);
		});
	});

	describe("GET /teachers/profile", () => {
		it("should get the teacher profile", async () => {
			database.query.mockResolvedValueOnce([{ name: "Angelica", lastName: "Ross", email: "aross1@email.com" }]);

			const response = await request(app)
				.get("/teachers/profile")
				.set("Authorization", `Bearer ${ teacherToken }`);

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("name", "Angelica");
			expect(response.body).toHaveProperty("lastName", "Ross");
			expect(response.body).toHaveProperty("email", "aross1@email.com");
		});
	});

	describe("PUT /teachers/profile", () => {
		it("should update the teacher profile with valid data", async () => {
			database.query.mockResolvedValueOnce([]);
			database.query.mockResolvedValueOnce({ affectedRows: 1 });

			const response = await request(app)
				.put("/teachers/profile")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "Angelica", lastName: "Ross", email: "aross1@email.com" });

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("updated");
		});

		it("should return 400 if name is empty", async () => {
			const response = await request(app)
				.put("/teachers/profile")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "", lastName: "Ross", email: "aross1@email.com" });

			expect(response.status).toBe(400);
		});

		it("should return 400 if lastName is empty", async () => {
			const response = await request(app)
				.put("/teachers/profile")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "Angelica", lastName: "", email: "aross1@email.com" });

			expect(response.status).toBe(400);
		});

		it("should return 400 if email is empty", async () => {
			const response = await request(app)
				.put("/teachers/profile")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "Angelica", lastName: "Ross", email: "" });

			expect(response.status).toBe(400);
		});

		it("should return 400 if email format is invalid", async () => {
			const response = await request(app)
				.put("/teachers/profile")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "Angelica", lastName: "Ross", email: "invalid-email" });

			expect(response.status).toBe(400);
		});

		it("should return 404 if email already exists", async () => {
			database.query.mockResolvedValueOnce([
				                                     {
					                                     id:       1,
					                                     name:     "Angelica",
					                                     lastName: "Ross",
					                                     email:    "aross1@email.com"
				                                     }
			                                     ]);

			const response = await request(app)
				.put("/teachers/profile")
				.set("Authorization", `Bearer ${ teacherToken }`)
				.send({ name: "Angelica", lastName: "Ross", email: "aross1@email.com", password: "password123" });
			expect(response.status).toBe(404);
			expect(response.body.error.email).toBe("profile.error.email.repeated");
		});
	});

	describe("GET /teachers/checkLogin", () => {
		it("should check login for a teacher", async () => {
			const response = await request(app)
				.get("/teachers/checkLogin")
				.set("Authorization", `Bearer ${ teacherToken }`);

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("user");
		});
	});
});