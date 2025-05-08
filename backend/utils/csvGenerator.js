export function generateCredentialsCSV(userData) {
    const headers = ['Email', 'Password', 'Full Name'];
    const row = [userData.email, userData.password, userData.fullName];
    return `${headers.join(',')}\n${row.join(',')}`;
}