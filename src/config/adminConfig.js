// Super Admin Configuration
// Add your admin email addresses here to grant full access

export const ADMIN_EMAILS = [
    'barneywong@gmail.com',
    'admin@horizon.finance',
    // Add more admin emails as needed
];

/**
 * Check if an email has Super Admin privileges
 * @param {string} email - User's email address
 * @returns {boolean} - True if the email is a Super Admin
 */
export const isAdminEmail = (email) => {
    if (!email) return false;
    return ADMIN_EMAILS.some(adminEmail =>
        adminEmail.toLowerCase() === email.toLowerCase()
    );
};
