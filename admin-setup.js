#!/usr/bin/env node

const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Generate a secure admin password hash
async function generatePasswordHash() {
  console.log(" Admin Password Setup Utility\n");

  // Get password from command line argument or generate one
  const password = process.argv[2] || generateRandomPassword();

  if (!process.argv[2]) {
    console.log(` Generated random password: ${password}`);
    console.log(
      ' You can also run: node admin-setup.js "your-custom-password"\n',
    );
  }

  try {
    // Generate hash
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);

    // Generate JWT secret
    const jwtSecret = crypto.randomBytes(64).toString("hex");

    console.log(" Setup complete! Add these to your .env file:\n");
    console.log(`ADMIN_PASSWORD=${password}`);
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log(`JWT_SECRET=${jwtSecret}\n`);

    console.log(
      " For production, you can remove ADMIN_PASSWORD and only use ADMIN_PASSWORD_HASH",
    );
    console.log(
      " Don't forget to add these to your Vercel environment variables too!",
    );
  } catch (error) {
    console.error(" Error generating password hash:", error);
  }
}

function generateRandomPassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Run the setup
generatePasswordHash();
