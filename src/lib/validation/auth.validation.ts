import { z } from 'zod';

// Zod schema dla logowania
export const SignInSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków')
});

export type SignInInput = z.infer<typeof SignInSchema>;

// Funkcja walidująca pojedyncze pole
export function validateField(
  field: 'email' | 'password',
  value: string
): string | null {
  try {
    if (field === 'email') {
      SignInSchema.shape.email.parse(value);
    } else if (field === 'password') {
      SignInSchema.shape.password.parse(value);
    }
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Nieprawidłowa wartość';
    }
    return 'Błąd walidacji';
  }
}
