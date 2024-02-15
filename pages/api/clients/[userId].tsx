import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../backend/connectMongo";
import { Client } from "../../../schemas/Client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    await connectMongo();

    const { userId } = req.query;

    if (req.method === "GET") {
        try {
            const client = await Client.findOne({ userId });

            res.status(200).json(client);
        } catch (error) {
            console.error(error);
            res.status(500).json(error);
        }
    }
};

export default handler;
