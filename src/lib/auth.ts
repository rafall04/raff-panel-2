import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verify, verifyPassword } from '@/utils/auth.server';

if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('FATAL: NEXTAUTH_SECRET environment variable is not set.');
}
  
export const authOptions: NextAuthOptions = {
    // adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'OTP',
            credentials: {
              phoneNumber: {},
              otp: {},
            },
            async authorize(credentials) {
                if (!credentials?.phoneNumber || !credentials.otp) {
                    throw new Error("Phone number and OTP are required.");
                }
                const r = await verify(credentials.phoneNumber, credentials.otp);

                if (r.status !== 200) {
                    throw new Error(`Backend returned status ${r.status}.`);
                }
                if (!r.token) {
                    throw new Error("Authentication failed: Token not received from backend.");
                }
                if (!r.user) {
                    throw new Error("Authentication failed: User data not received from backend.");
                }

                return {
                    id: credentials.phoneNumber,
                    deviceId: r.user.deviceId,
                    backendToken: r.token,
                    userData: r.user,
                };
            },
        }),
        CredentialsProvider({
            id: 'username-password',
            name: 'Username & Password',
            credentials: {
                username: {},
                password: {}
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials.password) {
                    throw new Error("Username and password are required.");
                }
                const r = await verifyPassword(credentials.username, credentials.password);

                if (r.status !== 200) {
                    throw new Error(r.message || `Authentication failed. Status: ${r.status}`);
                }
                if (!r.token) {
                    throw new Error("Authentication failed: Token not received from backend.");
                }
                if (!r.user) {
                    throw new Error("Authentication failed: User data not received from backend.");
                }
                if (!r.user.phoneNumber) {
                    throw new Error("Authentication failed: User data from backend did not include a phone number.");
                }

                return {
                    id: r.user.phoneNumber,
                    deviceId: r.user.deviceId,
                    backendToken: r.token,
                    userData: r.user,
                };
            }
        })
    ],
    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60
    },
    pages: {
        signIn: '/login'
    },
    secret: process.env.NEXTAUTH_SECRET!,
    callbacks: {
        async jwt({ token, user }){
            if (user) {
                token.id = user.id;
                token.deviceId = user.deviceId;
                token.backendToken = user.backendToken;
                token.userData = user.userData;
            }
            return token;
        },
        async session({ token, session }){
            session.user.id = token.id;
            session.user.deviceId = token.deviceId;
            session.user.backendToken = token.backendToken;
            session.user.userData = token.userData;
            return session;
        }
    }
}

export const getAuthSession = () => getServerSession(authOptions);