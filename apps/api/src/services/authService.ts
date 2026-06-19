import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { AppError } from "../errors.js";
import { signToken } from "../middleware/auth.js";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new AppError(401, "E-posta veya parola hatali");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError(401, "E-posta veya parola hatali");

  const authUser = { id: user.id, email: user.email, role: user.role, name: user.name };
  return { token: signToken(authUser), user: authUser };
}
