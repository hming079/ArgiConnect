INSERT INTO users(
        id,
        full_name,
        email,
        password_hash,
        phone,
        role,
        status
    )
VALUES (
        1,
        'Admin Khang',
        'admin.khang@sannongnghiep.vn',
        '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO',
        '0901111222',
        'ADMIN',
        'ACTIVE'
    ),
    (
        2,
        'Admin Le',
        'admin.le@sannongnghiep.vn',
        '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO',
        '0912222333',
        'ADMIN',
        'ACTIVE'
    ),
    (
        3,
        'Farmer Tam',
        'tam.nongdan@gmail.com',
        '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO',
        '0983333444',
        'FARMER',
        'ACTIVE'
    ),
    (
        4,
        'Farmer Hoa',
        'hoapham.farm@gmail.com',
        '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO',
        '0974444555',
        'FARMER',
        'ACTIVE'
    ),
    (
        5,
        'Farmer Luc',
        'luchoang.agri@gmail.com',
        '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO',
        '0965555666',
        'FARMER',
        'INACTIVE'
    ),
    (
        6,
        'Buyer Dat',
        'datngo.buyer@gmail.com',
        '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO',
        '0332223334',
        'BUYER',
        'ACTIVE'
    ),
    (
        7,
        'Buyer Ngoc',
        'ngocdoan.store@gmail.com',
        '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO',
        '0387778889',
        'BUYER',
        'INACTIVE'
    ),
    (
        8,
        'Logistics Tung',
        'tungdinh.logistics@gmail.com',
        '$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO',
        '0701112223',
        'LOGISTICS',
        'ACTIVE'
    ) ON CONFLICT(id) DO NOTHING;
SELECT setval(
        pg_get_serial_sequence('users', 'id'),
        GREATEST(
            (
                SELECT COALESCE(MAX(id), 1)
                FROM users
            ),
            1
        )
    );