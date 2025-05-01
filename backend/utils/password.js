import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a password
 * @param {string} password - The plaintext password to hash
 * @returns {Promise<string>} - The hashed password
 */
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plaintext password with a hash
 * @param {string} password - The plaintext password
 * @param {string} hash - The hashed password to compare against
 * @returns {Promise<boolean>} - Whether the passwords match
 */
export const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
}; 