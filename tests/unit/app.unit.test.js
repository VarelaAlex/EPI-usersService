const request = require("supertest");
const jwt = require("jsonwebtoken");
const database = require("../../database");
const { app, findRefreshToken, server } = require("../../app");
require("dotenv").config();

jest.mock("jsonwebtoken");
jest.mock("../../database");

describe("Express App", () => {

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll((done) => {
		server.close(done);
	});

	const mockDatabaseQuery = (result) => {
		database.query.mockResolvedValueOnce(result);
	};

	const mockJwtVerify = (user, error = null) => {
		jwt.verify.mockImplementation((token, secret, callback) => callback(error, user));
	};

	describe("findRefreshToken", () => {
		it("should return true for a valid refreshToken", async () => {
			mockDatabaseQuery([{ refreshToken: "validToken" }]);
			const result = await findRefreshToken("validToken");
			expect(result).toBe(true);
		});

		it("should return false for an invalid refreshToken", async () => {
			mockDatabaseQuery([]);
			const result = await findRefreshToken("invalidToken");
			expect(result).toBe(false);
		});
	});

	describe("POST /token", () => {
		it("should return 200 and a new accessToken for a valid refreshToken", async () => {
			mockDatabaseQuery([{ refreshToken: "validToken" }]);
			mockJwtVerify({ id: 1, role: "teacher" });
			jwt.sign.mockReturnValue("newAccessToken");

			const response = await request(app)
				.post("/token")
				.send({ refreshToken: "validToken" });

			expect(response.status).toBe(200);
			expect(response.body).toBe("newAccessToken");
		});

		it("should return 401 if refreshToken is missing", async () => {
			const response = await request(app)
				.post("/token")
				.send({});

			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: "Unauthorized" });
		});

		it("should return 403 if refreshToken is invalid", async () => {
			mockDatabaseQuery([]);
			const response = await request(app)
				.post("/token")
				.send({ refreshToken: "invalidToken" });

			expect(response.status).toBe(403);
			expect(response.body).toEqual({ error: "Forbidden" });
		});
	});

	describe("POST /logout", () => {
		it("should return 204 for a valid refreshToken", async () => {
			mockDatabaseQuery({ affectedRows: 1 });

			const response = await request(app)
				.post("/logout")
				.send({ token: "validToken" });

			expect(response.status).toBe(204);
		});

		it("should return 204 even if refreshToken is invalid", async () => {
			mockDatabaseQuery({ affectedRows: 0 });

			const response = await request(app)
				.post("/logout")
				.send({ token: "invalidToken" });

			expect(response.status).toBe(204);
		});
	});
});