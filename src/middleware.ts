import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/invoices/:path*", "/clients/:path*", "/analytics/:path*", "/settings/:path*"],
};