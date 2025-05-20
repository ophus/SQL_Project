const bcrypt = require('bcrypt');

const saltRounds = 10;

// Hash mật khẩu cho admin
bcrypt.hash('superadmin123', saltRounds, (err, hash) => {
    if (err) console.error(err);
    console.log('New hash for superadmin123:', hash);
});

// Hash mật khẩu cho user
bcrypt.hash('regularuser123', saltRounds, (err, hash) => {
    if (err) console.error(err);
    console.log('New hash for regularuser123:', hash);
});