import { test, expect, TEST_USERS } from "./fixtures";

/**
 * Przykładowe testy pokazujące jak używać fixtures i test users
 */

test.describe("Example: Using Test Fixtures", () => {
  test("should login automatically with authenticatedPage fixture", async ({ page, authenticatedPage }) => {
    // Użytkownik jest już zalogowany dzięki fixture!
    await page.goto("/");

    // Sprawdź czy jesteśmy zalogowani
    const cookies = await page.context().cookies();
    const hasAuthCookie = cookies.some((cookie) => cookie.name === "sb-access-token");
    expect(hasAuthCookie).toBe(true);
  });

  test("should access protected route when authenticated", async ({ page, authenticatedPage }) => {
    await page.goto("/account");

    // Nie powinno przekierować do /auth/login
    expect(page.url()).not.toContain("/auth/login");
    expect(page.url()).toContain("/account");
  });
});

test.describe("Example: Using Different Test Users", () => {
  // Użyj user2 zamiast domyślnego user1
  test.use({ testUser: TEST_USERS.user2 });

  test("should login as user2", async ({ page, authenticatedPage, testUser }) => {
    expect(testUser.email).toBe("test-user-2@example.com");

    await page.goto("/");

    // Zweryfikuj że jesteśmy zalogowani
    const cookies = await page.context().cookies();
    expect(cookies.some((cookie) => cookie.name === "sb-access-token")).toBe(true);
  });
});

test.describe("Example: Using Supabase Client", () => {
  test("should query data with supabase client", async ({ supabaseClient }) => {
    // Zaloguj się
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: TEST_USERS.user1.email,
      password: TEST_USERS.user1.password,
    });

    expect(signInError).toBeNull();

    // Pobierz użytkownika
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    expect(user).not.toBeNull();
    expect(user?.email).toBe(TEST_USERS.user1.email);

    // Pobierz firmy użytkownika
    const { data: companies, error: companiesError } = await supabaseClient.from("companies").select("*");

    expect(companiesError).toBeNull();
    // User powinien mieć co najmniej 1 firmę (utworzoną w global-setup)
    expect(companies?.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Example: Manual Login (without fixture)", () => {
  test("should login manually via UI", async ({ page }) => {
    await page.goto("/auth/login");

    await page.fill('input[type="email"]', TEST_USERS.user1.email);
    await page.fill('input[type="password"]', TEST_USERS.user1.password);

    await page.click('button[type="submit"]');

    // Poczekaj na przekierowanie
    await page.waitForURL((url) => !url.pathname.includes("/auth/login"));

    // Powinniśmy być na stronie głównej
    expect(page.url()).not.toContain("/auth/login");
  });
});
