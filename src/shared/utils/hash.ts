export const verifyPassword = async (password: string, passwordHash: string) => password === passwordHash;
