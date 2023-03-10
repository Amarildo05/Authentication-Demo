import { getSession } from "next-auth/react";
import { hashPassword, verifyPassword } from "../../../helpers/auth";
import { connectToDatabase } from "../../../helpers/db";

async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return;
    }

    const session = await getSession({ req: req });

    if (!session) {
        res.status(401).json({ message: 'Not authenticated!' });
        return;
    }

    const userEmail = session.user.email;   // find a user by email in the db 
    const oldPassword = req.body.oldPassword;   // check if the old password is correct
    const newPassword = req.body.newPassword;   // replace the old password with a new one

    const client = await connectToDatabase();

    const usersCollection = client.db().collection('users');

    const user = await usersCollection.findOne({ email: userEmail });

    if (!user) {
        res.status(404).json({ message: 'User not found.' });
        client.close();
        return;
    }

    const currentPassword = user.password;

    const passwordsAreEqual = await verifyPassword(oldPassword, currentPassword);

    if (!passwordsAreEqual) {
        res.status(403).json({ message: 'Invalid password.' });  
        client.close();
        return;                             // here we are authenticated but the current psw doesn't match with the old one
    }

    const hashedPassword = await hashPassword(newPassword);

    const result = await usersCollection.updateOne(
        { email: userEmail },
        { $set: { password: hashedPassword } }
    );

    client.close();
    res.status(200).json({ message: 'Password updated!' });
}

export default handler;