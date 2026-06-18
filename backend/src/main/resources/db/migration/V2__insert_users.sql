-- ===========================================================================
-- LƯU Ý: Mật khẩu mặc định cho TẤT CẢ tài khoản là: 123456
-- ===========================================================================

INSERT INTO users (full_name, email, password_hash, phone, role, status) VALUES
-- Tài khoản Quản trị (ADMIN)
('Nguyễn Văn Khang', 'admin.khang@sannongnghiep.vn', '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO', '0901111222', 'ADMIN', 'ACTIVE'),
('Trần Thị Lệ', 'admin.le@sannongnghiep.vn', ' $2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO', '0912222333', 'ADMIN', 'ACTIVE'),

-- Tài khoản Nông dân/Nhà cung cấp (FARMER)
('Lê Văn Tám', 'tam.nongdan@gmail.com', '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO', '0983333444', 'FARMER', 'ACTIVE'),
('Phạm Thị Hoa', 'hoapham.farm@gmail.com', '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO', '0974444555', 'FARMER', 'ACTIVE'),
('Hoàng Văn Lực', 'luchoang.agri@gmail.com', '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO', '0965555666', 'FARMER', 'INACTIVE'),

-- Tài khoản Người mua/Khách hàng (BUYER)
('Ngô Văn Đạt', 'datngo.buyer@gmail.com', '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO', '0332223334', 'BUYER', 'ACTIVE'),
('Đoàn Thị Ngọc', 'ngocdoan.store@gmail.com', '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO', '0387778889', 'BUYER', 'INACTIVE'),

-- Tài khoản Vận chuyển (LOGISTICS)
('Đinh Văn Tùng', 'tungdinh.logistics@gmail.com', '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO', '0701112223', 'LOGISTICS', 'ACTIVE');