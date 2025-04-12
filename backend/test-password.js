const bcrypt = require('bcryptjs');

async function testPasswordHashing() {
  try {
    // Original password
    const password = 'testpassword123';
    console.log('Original password:', password);
    
    // First hash (simulating what happens in authController.js)
    const salt1 = await bcrypt.genSalt(10);
    const hashedPassword1 = await bcrypt.hash(password, salt1);
    console.log('First hash:', hashedPassword1);
    
    // Second hash (simulating what happens in User model pre-save hook)
    const salt2 = await bcrypt.genSalt(10);
    const hashedPassword2 = await bcrypt.hash(hashedPassword1, salt2);
    console.log('Second hash (double hashed):', hashedPassword2);
    
    // Test comparing original password with first hash (should work)
    const match1 = await bcrypt.compare(password, hashedPassword1);
    console.log('Original password matches first hash:', match1);
    
    // Test comparing original password with second hash (should fail)
    const match2 = await bcrypt.compare(password, hashedPassword2);
    console.log('Original password matches second hash:', match2);
  } catch (error) {
    console.error('Error:', error);
  }
}

testPasswordHashing();
