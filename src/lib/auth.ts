import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verify, verifyPassword } from '@/utils/auth.server';
  
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
                // This is the original provider, now with the default 'credentials' id
                const r = await verify(credentials!.phoneNumber, credentials!.otp);
                if (r.status === 200 && r.token) {
                    return {
                        id: credentials!.phoneNumber,
                        deviceId: r.user.deviceId,
                        backendToken: r.token,
                    }
                }
                return null;
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
                const r = await verifyPassword(credentials!.username, credentials!.password);
                if (r.status === 200 && r.token && r.user) {
                    return {
                        id: credentials!.username,
                        deviceId: r.user.deviceId,
                        backendToken: r.token,
                    }
                }
                return null;
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
            }
            return token;
        },
        async session({ token, session }){
            session.user.id = token.id;
            session.user.deviceId = token.deviceId;
            session.user.backendToken = token.backendToken;
            return session;
        },
        redirect(){
            return '/dashboard';
        }
    }
}

export const getAuthSession = () => getServerSession(authOptions);