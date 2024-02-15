import { NextApiRequest, NextApiResponse } from "next";
import { User } from "../../../../schemas/User";
import connectMongo from "../../../../backend/connectMongo";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    await connectMongo();

    const { username } = req.query;

    if (req.method === "GET") {
        try {
            const user = await User.findOne({ username });

            res.status(200).json({ user });
        } catch (error) {
            console.error(error);
            res.status(500).json(error);
        }
    }
};

export default handler;
