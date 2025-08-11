import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verify } from '@/utils/auth.server';
  
export const authOptions: NextAuthOptions = {
    // adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
              phoneNumber: {},
              otp: {},
            },
            async authorize(credentials) {
                const r = await verify(credentials!.phoneNumber, credentials!.otp);
                if (r.status == 200) return {
                    id: credentials!.phoneNumber,
                    deviceId: r.user.deviceId
                }
                return null;
            },
          }),
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
            }
            return token;
        },
        async session({ token, session }){
            // session.user = {
            //     id: token!.id,
            //     deviceId: token!.deviceId
            // }
            session.user.id = token.id;
            session.user.deviceId = token.deviceId;
            return session;
        },
        redirect(){
            return '/dashboard';
        }
    }
}

export const getAuthSession = () => getServerSession(authOptions);