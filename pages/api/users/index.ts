import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../backend/connectMongo";
import { User } from "../../../schemas/User";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    await connectMongo();

    if (req.method === "POST") {
        // Because the json was stringified, we have to unstringify it with parse
        const user = new User(JSON.parse(req.body));

        try {
            await user.save();
            res.status(200).json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json(error);
        }
    }
};

export default handler;
