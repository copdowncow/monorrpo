import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

export const authRouter = Router();

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { login, password } = loginSchema.parse(req.body);

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('login', login)
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      { id: admin.id, login: admin.login, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: { id: admin.id, login: admin.login, role: admin.role, full_name: admin.full_name },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

authRouter.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  try {
    const token = authHeader.substring(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string; login: string; role: string;
    };
    res.json({ admin: payload });
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
});
