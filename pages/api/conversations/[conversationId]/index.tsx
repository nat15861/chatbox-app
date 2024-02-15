import { Http2ServerResponse } from "http2";
import { Model } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../../backend/connectMongo";
import { conversations } from "../../../../data/conversations";
import { Conversation } from "../../../../schemas/Conversation";
import { Test } from "../../../../schemas/Test";

const handler = async (req: NextApiRequest, res: any) => {
    console.log("hello?");
    console.log(req.query);
    // conversationId = parseInt(conversationId);

    // const conversation = conversations.find((c) => c.id === conversationId);

    // console.log("connecting to mongo");
    // await connectMongo();
    // console.log("connected to mongo");

    // const test = new Test({ name: "tester3", age: 10, height: 10 });

    // await test.save();

    // console.log(test);

    // if (req.method === "GET") {
    //     if (conversation) {
    //         res.status(200).json(conversation);
    //     } else {
    //         res.status(500).json({
    //             message: `Conversation with id ${conversationId} not found`,
    //         });
    //     }
    // }

    await connectMongo();

    const { conversationId } = req.query;

    if (req.method === "GET") {
        try {
            const conversation = await Conversation.findById(conversationId);
            res.status(200).json(conversation);
        } catch (error) {
            console.error(error);
            res.status(500).json(error);
        }
    } else if (req.method === "POST") {
        try {
            const { type, update } = JSON.parse(req.body);

            if (type === "ADD_MESSAGE") {
                // Try to call the find and update function and then return the output as the response
                // The stringified version of the update object is in the request body, so parse it and pass it in as the second parameter
                const conversation = await Conversation.findByIdAndUpdate(
                    conversationId,
                    update,
                    { new: true }
                );

                res.status(200).json(conversation);
            } else if (type === "DELETE_ALL_MESSAGES") {
                const conversation = await Conversation.findByIdAndUpdate(
                    conversationId,
                    { $set: { messages: [] } },
                    { new: true }
                );

                console.log(conversation);

                res.status(200).json(conversation);
            }
        } catch (error) {
            // If there is an error, print the error to the console and return it
            console.error(error);
            res.status(500).json(error);
        }
    }
};

export default handler;
