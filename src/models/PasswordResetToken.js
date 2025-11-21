/**
 * Password Reset Token Model
 * Table: password_reset_tokens
 */
export const PasswordResetTokenModel = {
  tableName: "password_reset_tokens",
  columns: {
    id: "id",
    user_id: "user_id",
    token: "token",
    expiry: "expiry",
    used: "used",
    created_at: "created_at",
  },
};

