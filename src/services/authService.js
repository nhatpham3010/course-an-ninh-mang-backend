/**
 * Auth Service
 * Handles authentication business logic
 */
import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { UserModel, PasswordResetTokenModel } from "../models/index.js";
import { exists, create, getOne } from "../utils/queryHelpers.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Generate reset code
 */
const generateResetCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
};

/**
 * Register a new user
 */
export const register = async (userData) => {
  const { ten, email, matkhau, ngaysinh } = userData;

  // Check if email exists
  const emailExists = await exists(UserModel.tableName, { email });
  if (emailExists) {
    throw new Error("Email đã tồn tại");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(matkhau, 10);

  // Create user with default course_type = 'free'
  const newUser = await pool.query(
    "INSERT INTO users (ten, matkhau, email, ngaysinh, course_type) VALUES ($1, $2, $3, $4, $5) RETURNING id, ten, email, ngaysinh, course_type",
    [ten, hashedPassword, email, ngaysinh, "free"]
  );

  return newUser.rows[0];
};

/**
 * Login user
 */
export const login = async (email, matkhau) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  
  if (result.rows.length === 0) {
    throw new Error("Email không tồn tại");
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(matkhau, user.matkhau);
  
  if (!isMatch) {
    throw new Error("Sai mật khẩu");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, ten: user.ten, role: user.role },
    process.env.JWT_SECRET || "secretkey",
    { expiresIn: "1d" }
  );

  return { token, user };
};

/**
 * Request password reset
 */
export const forgotPassword = async (email, ten) => {
  if (!email || !ten) {
    throw new Error("Vui lòng cung cấp email và họ tên");
  }

  // Check user
  const userQuery = `
    SELECT id, ten
    FROM users
    WHERE email = $1 AND ten = $2;
  `;
  const userResult = await pool.query(userQuery, [email, ten]);

  if (userResult.rows.length === 0) {
    throw new Error("Email hoặc họ tên không đúng");
  }

  const user = userResult.rows[0];

  // Generate reset code
  const code = generateResetCode();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save token
  await pool.query(
    "INSERT INTO password_reset_tokens (user_id, token, expiry) VALUES ($1, $2, $3) RETURNING id",
    [user.id, code, expiry]
  );

  // Send email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Mã Đặt Lại Mật Khẩu",
    text: `Mã đặt lại mật khẩu của bạn là: ${code}. Mã này có hiệu lực trong 1 giờ.`,
  };

  await transporter.sendMail(mailOptions);

  return { message: "Mã xác nhận đã được gửi qua email" };
};

/**
 * Verify reset code
 */
export const verifyResetCode = async (email, code) => {
  if (!email || !code) {
    throw new Error("Vui lòng cung cấp email và mã xác nhận");
  }

  const tokenQuery = `
    SELECT t.user_id, t.token, t.expiry, t.used
    FROM password_reset_tokens t
    JOIN users u ON u.id = t.user_id
    WHERE u.email = $1 AND t.token = $2 AND t.used = false;
  `;
  const tokenResult = await pool.query(tokenQuery, [email, code]);

  if (tokenResult.rows.length === 0) {
    throw new Error("Mã xác nhận không hợp lệ hoặc đã sử dụng");
  }

  const token = tokenResult.rows[0];

  if (new Date() > new Date(token.expiry)) {
    throw new Error("Mã xác nhận đã hết hạn");
  }

  return { userId: token.user_id };
};

/**
 * Update password
 */
export const updatePassword = async (userId, code, newPassword) => {
  if (!userId || !code || !newPassword) {
    throw new Error("Vui lòng cung cấp userId, mã xác nhận và mật khẩu mới");
  }

  // Check token
  const tokenQuery = `
    SELECT user_id, token, expiry, used
    FROM password_reset_tokens
    WHERE user_id = $1 AND token = $2 AND used = false;
  `;
  const tokenResult = await pool.query(tokenQuery, [userId, code]);

  if (tokenResult.rows.length === 0) {
    throw new Error("Mã xác nhận không hợp lệ hoặc đã sử dụng");
  }

  const token = tokenResult.rows[0];

  if (new Date() > new Date(token.expiry)) {
    throw new Error("Mã xác nhận đã hết hạn");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await pool.query("UPDATE users SET matkhau = $1 WHERE id = $2", [hashedPassword, userId]);

  // Mark token as used
  await pool.query("UPDATE password_reset_tokens SET used = true WHERE token = $1", [code]);

  return { message: "Đặt lại mật khẩu thành công" };
};

