import { z } from 'zod';

// Zod schema dla logowania
export const SignInSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków')
});

export type SignInInput = z.infer<typeof SignInSchema>;

// Zod schema dla rejestracji (server-side - bez confirmPassword)
export const SignUpSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
  companyName: z.string().optional()
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

// Zod schema dla rejestracji (client-side - z confirmPassword)
export const SignUpClientSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
  confirmPassword: z.string(),
  companyName: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła nie są zgodne',
  path: ['confirmPassword']
});

export type SignUpClientInput = z.infer<typeof SignUpClientSchema>;

// Zod schema dla resetu hasła
export const ResetPasswordSchema = z.object({
  email: z.string().email('Nieprawidłowy format email')
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// Zod schema dla aktualizacji hasła
export const UpdatePasswordSchema = z.object({
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła nie są zgodne',
  path: ['confirmPassword']
});

export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;

// Funkcja walidująca pojedyncze pole
export function validateField(
  field: 'email' | 'password' | 'confirmPassword' | 'companyName',
  value: string,
  compareValue?: string
): string | null {
  try {
    if (field === 'email') {
      SignInSchema.shape.email.parse(value);
    } else if (field === 'password') {
      SignInSchema.shape.password.parse(value);
    } else if (field === 'confirmPassword') {
      if (compareValue && value !== compareValue) {
        return 'Hasła nie są zgodne';
      }
    } else if (field === 'companyName') {
      // Nazwa firmy jest opcjonalna, więc zawsze prawidłowa
      return null;
    }
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Nieprawidłowa wartość';
    }
    return 'Błąd walidacji';
  }
}
