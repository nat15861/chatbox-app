import { Http2ServerRequest, Http2ServerResponse } from "http2";
import mongoose from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import { constSelector } from "recoil";
import connectMongo from "../../../backend/connectMongo";
import { conversations } from "../../../data/conversations";
import { Conversation } from "../../../schemas/Conversation";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    console.log(req.query);

    await connectMongo();

    if (req.method === "GET") {
        try {
            const conversations = await Conversation.find({});
            res.status(200).json(conversations);
        } catch (error) {
            console.error(error);
            res.status(500).json(error);
        }
    } else if (req.method === "POST") {
        try {
            const { type, members } = JSON.parse(req.body);

            if (type === "Direct") {
                const conversation = new Conversation({
                    type,
                    name: "",
                    icon: "",
                    members,
                    messages: [],
                });
                await conversation.save();

                //console.log("before " + conversation);

                res.status(200).json(conversation);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json(error);
        }
    }
};

export default handler;
