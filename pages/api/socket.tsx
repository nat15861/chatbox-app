import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Conversation, IMessage } from "../../schemas/Conversation";
import connectMongo from "../../backend/connectMongo";
import { Client } from "../../schemas/Client";
import { IClientUpdate } from "../../components/FriendsAdd";
import { User } from "../../schemas/User";

const handler = async (req: NextApiRequest, res: any) => {
    const { action } = JSON.parse(req.body);

    let io: Server;

    if (action === "UPDATE_SERVER") {
        // No idea what the type of this res is
        // I think an http response gets passed in but next does something funky with it so that it has a server object (and other things) on it, even though theres not one in NextApiResponse
        if (res.socket.server.io) {
            console.log("Server socket io thing is here");

            io = res.socket.server.io;
        } else {
            console.log("Making a new socket thing");
            const newIo = new Server(res.socket.server);

            res.socket.server.io = newIo;

            io = newIo;
        }
        //console.log(io);

        io.removeAllListeners();

        io.on("connection", async (socket) => {
            console.log("socket connected with id", socket.id);

            // const connecteDbUser = await User.findByIdAndUpdate(
            //     client.userId,
            //     { status: "Offline" },
            //     { new: true }
            // );

            // console.log(connecteDbUser);

            socket.on("connect", () => {
                console.log("Socket is now connected");
            });

            socket.on("join_room", (room: string) => {
                console.log("joining socket", socket.id, "to room", room);

                socket.join(room);

                // prettier-ignore
                io.to(room).emit("info", "Socket " + socket.id + " just joined room " + room);
            });

            socket.on("join_default_room", () => {
                socket.join(socket.id);

                console.log("joining");
                // prettier-ignore
                io.to(socket.id).emit("info", "Socket " + socket.id + " just joined default room " + socket.id);
            });

            // Takes the user id sent by the socket, and pairs it with the socket id to insert a "Client" document into the database
            socket.on("register_client", async (userId: string) => {
                await connectMongo();

                const socketId = socket.id;

                try {
                    const clientResponse = await Client.findOneAndUpdate(
                        { userId },
                        {
                            $push: { sockets: socketId },
                        },
                        { new: true }
                    );

                    console.log(clientResponse);
                } catch (error) {
                    console.error(error);
                }

                //prettier-ignore
                console.log("registering client with user id ", userId, " and socket id ", socketId);
                socket.emit(
                    "info",
                    `registering client with user id ${userId} and socket id ${socketId}`
                );

                socket.emit("appear_online");
            });

            socket.on("disconnect", async () => {
                await connectMongo();

                const socketId: string = socket.id;

                // Filter that grabs the user with the matching socket id in its sockets array
                const filter = {
                    sockets: { $elemMatch: { $eq: socketId } },
                };

                const client = await Client.findOne(filter);

                console.log(client.sockets);

                console.log(
                    client.sockets.length <= 1
                        ? "user going offline"
                        : "user staying online"
                );

                // If we need to go offline
                if (client.sockets.length <= 1) {
                    const clientUser = await User.findById(client.userId);

                    console.log(clientUser);

                    // Grab all of the clients friends
                    const clientFriendIds: string[] = clientUser.friends.map(
                        (friend: any) => friend.friendId.toString()
                    );

                    // Grab all of the clients conversations
                    const clientConversationIds: string[] =
                        clientUser.conversations.map((conversation: any) =>
                            conversation.toString()
                        );

                    console.log(clientFriendIds);
                    console.log(clientConversationIds);

                    // Update the clients friends
                    clientFriendIds.forEach(async (friendId: string) => {
                        // prettier-ignore
                        const friendSockets: string[] = (await Client.findOne({userId: friendId})).sockets;

                        console.log(friendSockets);

                        friendSockets.forEach((friendSocket) => {
                            //prettier-ignore
                            console.log("Sending message to socket", friendSocket);

                            const clientUpdate: IClientUpdate = {
                                target: friendSocket,
                                updateType: "UPDATE_FRIEND",
                                content: {
                                    friendId: client.userId,
                                    updateInfo: { status: "Offline" },
                                },
                            };

                            console.log(clientUpdate);

                            io.to(friendSocket).emit("update", clientUpdate);
                        });
                    });

                    // Update the clients conversations
                    clientConversationIds.forEach(async (conversationId) => {
                        const conversation = await Conversation.findById(
                            conversationId
                        );

                        let initialContent: any[] = [];

                        if (conversation.type === "Direct") {
                            initialContent = [
                                {
                                    conversationUpdateType: "UPDATE_ATTRIBUTE",
                                    conversationId,
                                    conversationUpdate: {
                                        status: "Offline",
                                    },
                                },
                            ];
                        }

                        const clientUpdate: IClientUpdate = {
                            target: conversationId,
                            updateType: "UPDATE_CONVERSATION",
                            content: [
                                ...initialContent,
                                {
                                    // prettier-ignore
                                    conversationUpdateType: "UPDATE_ARRAY_ELEMENT",
                                    conversationId,
                                    elementArray: "members",
                                    elementId: client.userId,
                                    conversationUpdate: {
                                        status: "Offline",
                                    },
                                },
                            ],
                        };

                        console.log(clientUpdate);

                        socket.to(conversationId).emit("update", clientUpdate);
                    });

                    // Change db status to offline
                    const dbUser = await User.findByIdAndUpdate(
                        client.userId,
                        { status: "Offline" },
                        { new: true }
                    );

                    console.log(dbUser);
                }

                let userId;

                try {
                    const update = {
                        $pull: { sockets: { $eq: socketId } },
                    };

                    const newClientResponse = await Client.findOneAndUpdate(
                        filter,
                        update,
                        { new: true }
                    );

                    userId = newClientResponse.userId;

                    console.log(newClientResponse);
                } catch (error) {
                    console.error(error);
                }

                socket.emit("test");

                //prettier-ignore
                console.log("disconnecting client with user id ", userId, " and socket id ", socketId);
            });

            socket.on("send_room_update", (clientUpdate: IClientUpdate) => {
                const { target: targetRoom } = clientUpdate;

                console.log("Sending message to room", targetRoom);

                socket.to(targetRoom).emit("update", clientUpdate);
            });

            socket.on("send_client_update", (clientUpdate: IClientUpdate) => {
                const { target: targetSocket } = clientUpdate;

                console.log("Sending message to socket", targetSocket);

                io.to(targetSocket).emit("update", clientUpdate);
            });

            socket.on("test", () => {
                console.log("Received test event from client");
            });
        });
    }

    //console.log(res.socket.server);

    res.end();
};

export default handler;
