/**
 * Payment Model
 * Table: thanhtoan
 */
export const PaymentModel = {
  tableName: "thanhtoan",
  columns: {
    id: "id",
    user_id: "user_id",
    ho_ten: "ho_ten",
    email: "email",
    so_dien_thoai: "so_dien_thoai",
    phuong_thuc_thanh_toan: "phuong_thuc_thanh_toan",
    ten_goi: "ten_goi",
    so_tien: "so_tien",
    ngay_thanh_toan: "ngay_thanh_toan",
    trang_thai: "trang_thai",
    hinh_anh_chung_minh: "hinh_anh_chung_minh", // URL của hình ảnh chứng minh
  },
};

