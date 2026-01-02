# Login View - Testing Guide

## 🎯 Zaimplementowane komponenty

### ✅ Frontend
- **Strona logowania**: [src/pages/login.astro](../src/pages/login.astro)
- **Formularz logowania**: [src/components/auth/LoginForm.tsx](../src/components/auth/LoginForm.tsx)
- **Walidacja**: [src/lib/validation/auth.validation.ts](../src/lib/validation/auth.validation.ts)

### ✅ Backend API
- **POST /api/auth/signin**: [src/pages/api/auth/signin.ts](../src/pages/api/auth/signin.ts)
- **GET /api/profile**: [src/pages/api/profile.ts](../src/pages/api/profile.ts)

### ✅ Infrastructure
- **Middleware**: [src/middleware/index.ts](../src/middleware/index.ts) - obsługa sesji Supabase

## 🧪 Jak przetestować

### 1. Uruchomienie aplikacji

```bash
npm run dev
```

Aplikacja uruchomi się na `http://localhost:3000`

### 2. Przejście do strony logowania

Otwórz w przeglądarce: `http://localhost:3000/login`

### 3. Testowanie walidacji formularza

#### Test 1: Puste pola
1. Kliknij "Zaloguj się" bez wypełniania pól
2. **Oczekiwany rezultat**: Czerwone ramki wokół pól + komunikaty:
   - "Nieprawidłowy format email"
   - "Hasło musi mieć co najmniej 8 znaków"

#### Test 2: Nieprawidłowy email
1. Wpisz: `nieprawidlowy-email`
2. Kliknij poza pole (blur)
3. **Oczekiwany rezultat**: Czerwona ramka + komunikat "Nieprawidłowy format email"

#### Test 3: Za krótkie hasło
1. Email: `test@test.com`
2. Hasło: `123` (< 8 znaków)
3. Kliknij poza pole hasła
4. **Oczekiwany rezultat**: Czerwona ramka + komunikat "Hasło musi mieć co najmniej 8 znaków"

#### Test 4: Walidacja w czasie rzeczywistym
1. Wpisz poprawny email: `user@example.com`
2. Kliknij poza pole (blur) - błąd znika
3. Zmień email na nieprawidłowy: `user@`
4. **Oczekiwany rezultat**: Błąd pojawia się natychmiast podczas pisania (po dotknięciu pola)

### 4. Testowanie logowania (wymaga działającej bazy danych)

#### Test 5: Nieprawidłowe dane logowania
1. Email: `nieistniejacy@test.com`
2. Hasło: `nieprawidlowehaslo123`
3. Kliknij "Zaloguj się"
4. **Oczekiwany rezultat**: 
   - Alert na górze formularza
   - Komunikat: "Nieprawidłowy email lub hasło"
   - Możliwość zamknięcia alertu (X)

#### Test 6: Poprawne logowanie (wymaga istniejącego użytkownika)
1. Email: (prawidłowy email z bazy)
2. Hasło: (prawidłowe hasło)
3. Kliknij "Zaloguj się"
4. **Oczekiwany rezultat**:
   - Przycisk zmienia się na "Logowanie..." ze spinnerem
   - Przekierowanie do `/companies/{company_id}/dashboard`

#### Test 7: Użytkownik bez firm
1. Zaloguj się użytkownikiem, który nie ma przypisanych firm
2. **Oczekiwany rezultat**:
   - Alert: "Brak przypisanych firm. Skontaktuj się z administratorem."
   - Brak przekierowania

### 5. Testowanie nawigacji klawiaturą

#### Test 8: Nawigacja Tab
1. Wciśnij Tab - fokus na pole Email
2. Wciśnij Tab - fokus na pole Hasło
3. Wciśnij Tab - fokus na przycisk "Zaloguj się"
4. **Oczekiwany rezultat**: Wyraźne wskazanie fokusa (niebieska ramka)

#### Test 9: Submit przez Enter
1. Wpisz dane w pole Email
2. Wciśnij Enter (bez klikania przycisku)
3. **Oczekiwany rezultat**: Formularz zostaje wysłany

### 6. Testowanie przekierowania zalogowanego użytkownika

#### Test 10: Dostęp do /login gdy zalogowany
1. Zaloguj się
2. Wpisz w URL: `http://localhost:3000/login`
3. **Oczekiwany rezultat**: Automatyczne przekierowanie do dashboardu

## 🔍 Testowanie API (curl/Postman)

### Test API: POST /api/auth/signin

```bash
# Test 1: Błąd walidacji (brak hasła)
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com"}'

# Oczekiwana odpowiedź: 400 Bad Request
# {
#   "error": {
#     "code": "VALIDATION_ERROR",
#     "message": "Invalid request data",
#     "details": [...]
#   }
# }

# Test 2: Nieprawidłowe dane logowania
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "wrong@test.com", "password": "wrongpass123"}'

# Oczekiwana odpowiedź: 401 Unauthorized

# Test 3: Poprawne logowanie
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "correctpassword"}'

# Oczekiwana odpowiedź: 200 OK
# {
#   "user": {
#     "id": "...",
#     "email": "user@example.com"
#   },
#   "session": {
#     "access_token": "...",
#     "refresh_token": "..."
#   }
# }
```

### Test API: GET /api/profile

```bash
# Test 1: Brak autoryzacji
curl http://localhost:3000/api/profile

# Oczekiwana odpowiedź: 401 Unauthorized

# Test 2: Z tokenem (po zalogowaniu)
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Oczekiwana odpowiedź: 200 OK
# {
#   "user_id": "...",
#   "default_company_id": "...",
#   "created_at": "...",
#   "companies": [...]
# }
```

## 📝 Znane ograniczenia

1. **Middleware cookie handling**: Obecna implementacja używa podstawowej obsługi cookies przez Supabase. W produkcji zalecane jest użycie `@supabase/ssr` dla lepszej obsługi sesji.

2. **Brak funkcji "Remember me"**: Nie zaimplementowano - planowane na przyszłość.

3. **Brak "Forgot password"**: Nie zaimplementowano - planowane na przyszłość.

4. **Brak OAuth providers**: Tylko email/password - OAuth można dodać później.

## 🐛 Debugging

### Console errors
- `console.error()` w catch blockach jest celowe i pomaga w debugowaniu
- Sprawdź DevTools Console dla szczegółowych informacji o błędach

### Network inspection
- Otwórz DevTools → Network tab
- Sprawdź request/response dla `/api/auth/signin` i `/api/profile`
- Sprawdź status code i response body

### Supabase Auth
- Sprawdź czy zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_KEY` są poprawne
- Sprawdź czy użytkownik istnieje w Supabase Auth Dashboard
- Sprawdź czy RLS policies są poprawnie skonfigurowane dla tabel `user_profiles` i `company_members`

## ✅ Checklist testowania

- [ ] Walidacja pustych pól
- [ ] Walidacja nieprawidłowego email
- [ ] Walidacja krótkiego hasła
- [ ] Walidacja w czasie rzeczywistym
- [ ] Błąd nieprawidłowego logowania
- [ ] Poprawne logowanie i przekierowanie
- [ ] Użytkownik bez firm
- [ ] Nawigacja Tab
- [ ] Submit przez Enter
- [ ] Przekierowanie zalogowanego użytkownika
- [ ] Zamykanie alertu błędu
- [ ] Responsywność (mobile, tablet, desktop)
- [ ] Dostępność (screen reader - opcjonalnie)
