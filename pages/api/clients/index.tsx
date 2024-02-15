import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../backend/connectMongo";
import { Client } from "../../../schemas/Client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    await connectMongo();

    if (req.method === "POST") {
        const { userId } = JSON.parse(req.body);

        try {
            const client = new Client({
                userId,
                sockets: [],
            });
            await client.save();

            res.status(200).json(client);
        } catch (error) {
            console.error(error);
            res.status(500).json(error);
        }
    }
};

export default handler;
