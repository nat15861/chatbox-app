import { Types } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../backend/connectMongo";
import { User } from "../../../schemas/User";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    await connectMongo();

    const { id } = req.query;

    console.log(req.method);
    console.log(req.body);

    if (req.method === "GET") {
        try {
            const user = await User.findById(id);
            res.status(200).json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json(error);
        }
    } else if (req.method === "POST") {
        try {
            const { type, update } = JSON.parse(req.body);

            if (type === "UPDATE") {
                const user = await User.findByIdAndUpdate(id, update, {
                    new: true,
                });
                res.status(200).json(user);
            } else if (type === "FILTERED_UPDATE") {
                const { filter } = JSON.parse(req.body);

                const user = await User.findOneAndUpdate(filter, update, {
                    new: true,
                });
                res.status(200).json(user);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json(error);
        }
    }
};

export default handler;
