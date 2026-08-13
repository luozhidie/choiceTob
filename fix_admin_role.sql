-- 1. 把 luozhidie@live.cn 设为 admin（如果记录存在）
UPDATE profiles SET role = 'admin', approval_status = 'approved' WHERE email = 'luozhidie@live.cn';

-- 2. 如果记录不存在，先看看有哪些账号
SELECT id, email, role, approval_status FROM profiles LIMIT 5;
