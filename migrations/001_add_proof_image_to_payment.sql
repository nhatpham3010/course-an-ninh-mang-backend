-- Migration: Add hinh_anh_chung_minh field to thanhtoan table
-- Date: 2024

-- Add column hinh_anh_chung_minh (proof image URL) to thanhtoan table
ALTER TABLE thanhtoan 
ADD COLUMN IF NOT EXISTS hinh_anh_chung_minh TEXT;

-- Add comment to column
COMMENT ON COLUMN thanhtoan.hinh_anh_chung_minh IS 'URL của hình ảnh chứng minh thanh toán';

