import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const jwtSecret = process.env.JWT_SECRET!;


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function generateToken(user: { id: string; role: string; email: string }) {
  const payload = {
    id: user.id,
    role: user.role,
    email: user.email,
  };
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
}


export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded as { id: string; role: string; email: string; iat: number; exp: number };
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}
