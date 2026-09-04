import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values: Array<{ name: string; value: string; options?: any }>) {
          values.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({ request });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (
    error &&
    (error.name === "AuthApiError" ||
      error.message?.toLowerCase().includes("refresh token") ||
      (error as any).status === 400 ||
      (error as any).code === "refresh_token_not_found")
  ) {
    const allCookies = request.cookies.getAll();
    for (const c of allCookies) {
      if (c.name.includes("sb-") || c.name.includes("auth-token")) {
        response.cookies.set(c.name, "", { maxAge: 0, path: "/" });
      }
    }
  }

  if (request.nextUrl.pathname.startsWith("/admin") && !user) {
    return NextResponse.redirect(new URL("/login?next=/admin", request.url));
  }

  return response;
}

export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
