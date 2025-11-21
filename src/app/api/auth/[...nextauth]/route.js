import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const adminPassword = process.env.ADMIN_PASSWORD;

                if (credentials?.password === adminPassword) {
                    // Return a mock user object
                    return { id: "1", name: "Admin", email: "admin@example.com" };
                }
                return null;
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    secret: process.env.AUTH_SECRET,
});

export { handler as GET, handler as POST };
