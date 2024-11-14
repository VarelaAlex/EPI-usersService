const jwt = require("jsonwebtoken");
const { generateTokens, authenticateToken, isTeacher, isStudent } = require("../../auth");

jest.mock("jsonwebtoken");

describe("Auth Middleware", () => {
	describe("generateTokens", () => {
		it("should generate access and refresh tokens", () => {
			const user = { id: 1, role: "teacher" };
			const accessToken = "access-token";
			const refreshToken = "refresh-token";

			jwt.sign.mockReturnValueOnce(accessToken).mockReturnValueOnce(refreshToken);

			const tokens = generateTokens(user);

			expect(tokens).toEqual({ accessToken, refreshToken });
			expect(jwt.sign)
				.toHaveBeenCalledWith({ id: user.id, role: user.role },
				                      process.env.ACCESS_TOKEN_SECRET,
				                      { expiresIn: "15m" }
				);
			expect(jwt.sign)
				.toHaveBeenCalledWith({ id: user.id, role: user.role },
				                      process.env.REFRESH_TOKEN_SECRET,
				                      { expiresIn: "7d" }
				);
		});
	});

	describe("authenticateToken", () => {
		let req, res, next;

		beforeEach(() => {
			req = { headers: { authorization: "Bearer token" } };
			res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
			next = jest.fn();
		});

		it("should call next if token is valid", () => {
			const user = { id: 1, role: "teacher" };
			jwt.verify.mockImplementation((token, secret, callback) => callback(null, user));

			authenticateToken(req, res, next);

			expect(jwt.verify).toHaveBeenCalledWith("token", process.env.ACCESS_TOKEN_SECRET, expect.any(Function));
			expect(req.user).toEqual(user);
			expect(next).toHaveBeenCalled();
		});

		it("should return 401 if no token is provided", () => {
			req.headers.authorization = undefined;

			authenticateToken(req, res, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
			expect(next).not.toHaveBeenCalled();
		});

		it("should return 403 if token is invalid", () => {
			jwt.verify.mockImplementation((token, secret, callback) => callback(new Error("Invalid token"), null));

			authenticateToken(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("isTeacher", () => {
		let req, res, next;

		beforeEach(() => {
			req = { user: { role: "teacher" } };
			res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
			next = jest.fn();
		});

		it("should call next if user is a teacher", () => {
			isTeacher(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it("should return 403 if user is not a teacher", () => {
			req.user.role = "student";

			isTeacher(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("isStudent", () => {
		let req, res, next;

		beforeEach(() => {
			req = { user: { role: "student" } };
			res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
			next = jest.fn();
		});

		it("should call next if user is a student", () => {
			isStudent(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it("should return 403 if user is not a student", () => {
			req.user.role = "teacher";

			isStudent(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
			expect(next).not.toHaveBeenCalled();
		});
	});
});