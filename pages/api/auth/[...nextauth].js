import NextAuth from "next-auth/next";
import { verifyPassword } from "../../../helpers/auth";
import { connectToDatabase } from "../../../helpers/db";
import CredentialsProvider from "next-auth/providers/credentials";

export default NextAuth({
    session: {
        jwt: true,
    },
    providers: [
        CredentialsProvider({
            async authorize(credentials) {
                const client = await connectToDatabase();

                const usersCollection = client.db().collection('users');

                const user = await usersCollection.findOne({
                    email: credentials.email,
                });

                if (!user) {
                    client.close();
                    throw new Error('No user found!');
                }

                const isValid = await verifyPassword(
                    credentials.password,
                    user.password
                );

                if (!isValid) {
                    client.close();
                    throw new Error('Could not login!');
                }

                client.close();
                return { email: user.email };
            },
        }),
    ],
});