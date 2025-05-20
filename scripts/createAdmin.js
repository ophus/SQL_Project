const bcrypt = require('bcrypt');

async function createAdminPassword() {
    const password = 'admin123';
    const saltRounds = 10;

    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Hashed password for admin:', hash);
    } catch (error) {
        console.error('Error creating hash:', error);
    }
}

createAdminPassword(); 