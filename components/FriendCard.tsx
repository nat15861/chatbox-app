import { FiCheck, FiMoreVertical } from "react-icons/fi";
import { GrClose } from "react-icons/gr";
import UserIcon from "./UserIcon";

import { useState } from "react";
import { MdMessage } from "react-icons/md";
import { IFriend, IUser } from "../schemas/User";
import { VscChromeClose } from "react-icons/vsc";
import { BsCheck2 } from "react-icons/bs";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
    emitEventTriggersState,
    conversationState,
    userState,
    socketIdState,
} from "../pages";
import { getUserSockets } from "../util/getUserSockets";
import { mainWindowState } from "./MainWindow";
import { Types } from "mongoose";
import { IConversation } from "../schemas/Conversation";
import { IEventTrigger } from "./ConversationInput";

const FriendCard = ({ friend }: { friend: IFriend }) => {
    const { type, _id, username, pfp, status, customStatus } = friend;

    const [user, setUser] = useRecoilState(userState);

    const setEmitEventTriggers = useSetRecoilState(emitEventTriggersState);

    const setMainWindow = useSetRecoilState(mainWindowState);

    const setConversation = useSetRecoilState(conversationState);

    const socketId = useRecoilValue(socketIdState);

    const pendingCard = type === "Incoming" || type === "Outgoing";

    const [statusBgColor, setStatusBgColor] = useState("#1f2937");

    const acceptFriendRequest = async () => {
        // Check to see if the friend is online, and grab their connected sockets
        const friendSockets = await getUserSockets(_id);

        const friendOnline = friendSockets.length !== 0;

        const userResponse = await fetch(`api/users/${user._id}`, {
            method: "POST",
            body: JSON.stringify({
                type: "FILTERED_UPDATE",
                // Instead of updating by id, we will pass a filter that will manually check the id, as well as checking the friend id of the friends array
                filter: { _id: user._id, "friends.friendId": _id },
                // The filter will target the specific friend object with the correct id, and the update will then modify that friend object's friend type
                update: {
                    $set: {
                        "friends.$.friendType": "All",
                    },
                },
            }),
        });

        const newDbUser = await userResponse.json();

        console.log(newDbUser);

        // Update the friend on the client side
        // The way we have to do this is super dumb
        setUser((oldUser) => {
            // First we grab the index of the friend that we need to modify
            const friendIndex = oldUser.friends.findIndex((friend) => {
                return friend._id === _id;
            });

            // Then we recreate that object with the updated value
            const newFriend = {
                ...oldUser.friends[friendIndex],
                type: "All",
                status: friendOnline ? "Online" : "Offline",
            };

            // Then we have to make this mess of an object where we destructure everything,
            // slice the friends array around the friend index, and then insert the new object in the middle
            // Fml
            const newUser = {
                ...oldUser,
                friends: [
                    ...oldUser.friends.slice(0, friendIndex),
                    newFriend,
                    ...oldUser.friends.slice(friendIndex + 1),
                ],
            };

            return newUser;
        });

        const userSockets = await getUserSockets(user._id);

        setEmitEventTriggers((oldTriggers) => {
            const [{ updater }] = oldTriggers;

            const newTriggers = userSockets
                .filter((socket) => socket !== socketId)
                .map((socket, index) => {
                    const indexRemainder = index % 2;

                    const newTrigger: IEventTrigger = {
                        event: "SEND_UPDATE",
                        info: {
                            destination: "CLIENT",
                            clientUpdate: {
                                target: socket,
                                updateType: "UPDATE_FRIEND",
                                content: {
                                    friendId: _id,
                                    updateInfo: {
                                        type: "All",
                                        status: friendOnline
                                            ? "Online"
                                            : "Offline",
                                    },
                                },
                            },
                        },
                        updater: indexRemainder === 0 ? !updater : updater,
                    };

                    return newTrigger;
                });

            return newTriggers.length === 0 ? oldTriggers : newTriggers;
        });

        const friendResponse = await fetch(`api/users/${_id}`, {
            method: "POST",
            body: JSON.stringify({
                type: "FILTERED_UPDATE",
                // Instead of updating by id, we will pass a filter that will manually check the id, as well as checking the friend id of the friends array
                filter: { _id: _id, "friends.friendId": user._id },
                // The filter will target the specific friend object with the correct id, and the update will then modify that friend object's friend type
                update: {
                    $set: {
                        "friends.$.friendType": "All",
                    },
                },
            }),
        });

        const friend = await friendResponse.json();

        console.log(friend);

        if (!friendOnline) return;

        setEmitEventTriggers(([{ updater }]) => {
            return friendSockets.map((socket, index) => {
                const indexRemainder = index % 2;

                return {
                    event: "SEND_UPDATE",
                    info: {
                        destination: "CLIENT",
                        clientUpdate: {
                            target: socket,
                            updateType: "UPDATE_FRIEND",
                            content: {
                                friendId: user._id,
                                updateInfo: { type: "All", status: "Online" },
                            },
                        },
                    },
                    updater: indexRemainder === 0 ? !updater : updater,
                };
            });
        });
    };

    const openConversation = async () => {
        const friendConversationIndex = user.conversations.findIndex(
            ({ members }) =>
                members.length === 2 &&
                members.some((member) => member._id === _id)
        );

        console.log(
            "convo with index ",
            friendConversationIndex ? "there" : "not there"
        );

        if (friendConversationIndex !== -1) {
            setConversation(friendConversationIndex);

            setMainWindow("CONVERSATION");

            return;
        }

        const dbConversationResponse = await fetch("api/conversations", {
            method: "POST",
            body: JSON.stringify({
                type: "Direct",
                members: [user._id, _id],
            }),
        });

        const dbConversation = await dbConversationResponse.json();

        console.log(dbConversation);

        const { _id: conversationId } = dbConversation;

        const dbUserResponse = await fetch(`api/users/${user._id}`, {
            method: "POST",
            body: JSON.stringify({
                type: "UPDATE",
                update: {
                    $push: {
                        conversations: new Types.ObjectId(conversationId),
                    },
                },
            }),
        });

        const dbUser = await dbUserResponse.json();

        console.log(dbUser);

        const newConversation: IConversation = {
            id: conversationId,
            type: "Direct",
            name: username,
            icon: pfp,
            status,
            customStatus,
            // We have to add as IUser otherwise the compiler will complain about not having all of the required fields
            members: [
                {
                    _id: user._id,
                    username: user.username,
                    pfp: user.pfp,
                    status: user.status,
                    customStatus: user.customStatus,
                } as IUser,
                {
                    _id,
                    username,
                    pfp,
                    status,
                    customStatus,
                } as IUser,
            ],
            messages: [],
        };

        setUser((oldUser) => {
            return {
                ...oldUser,
                conversations: [...oldUser.conversations, newConversation],
            };
        });

        setEmitEventTriggers(([{ updater }]) => {
            return [
                {
                    event: "JOIN_ROOM",
                    info: {
                        room: conversationId,
                    },
                    updater: !updater,
                },
            ];
        });

        setConversation(dbUser.conversations.length - 1);

        setMainWindow("CONVERSATION");

        const userSockets = await getUserSockets(user._id);

        setEmitEventTriggers((oldTriggers) => {
            const [{ updater }] = oldTriggers;

            const newTriggers = userSockets
                .filter((socket) => socket !== socketId)
                .map((socket, index) => {
                    const indexRemainder = index % 2;

                    const newTrigger: IEventTrigger = {
                        event: "SEND_UPDATE",
                        info: {
                            destination: "CLIENT",
                            clientUpdate: {
                                target: socket,
                                updateType: "ADD_CONVERSATION",
                                content: newConversation,
                            },
                        },
                        updater: indexRemainder === 0 ? !updater : updater,
                    };

                    return newTrigger;
                });

            return newTriggers.length === 0 ? oldTriggers : newTriggers;
        });

        const newFriendConversation: IConversation = {
            ...newConversation,
            name: user.username,
            icon: user.pfp,
            status: user.status,
            customStatus: user.customStatus,
        };

        const friendSockets = await getUserSockets(_id);

        const newFriendResponse = await fetch(`api/users/${_id}`, {
            method: "POST",
            body: JSON.stringify({
                type: "UPDATE",
                update: {
                    $push: {
                        conversations: new Types.ObjectId(conversationId),
                    },
                },
            }),
        });

        const newFriend = await newFriendResponse.json();

        console.log(newFriend);

        // Friend is offline, return
        if (friendSockets.length === 0) return;

        setEmitEventTriggers(([{ updater }]) => {
            return friendSockets.map((socket, index) => {
                const indexRemainder = index % 2;

                return {
                    event: "SEND_UPDATE",
                    info: {
                        destination: "CLIENT",
                        clientUpdate: {
                            target: socket,
                            updateType: "ADD_CONVERSATION",
                            content: newFriendConversation,
                        },
                    },
                    updater: indexRemainder === 0 ? !updater : updater,
                };
            });
        });
    };

    return (
        <div
            className="w-full h-14 px-2 hover:bg-gray-700 rounded-md flex justify-between items-center cursor-pointer"
            onMouseEnter={() => setStatusBgColor("#374151")}
            onMouseLeave={() => setStatusBgColor("#1f2937")}
        >
            <div className="w-full h-full border-t border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {pendingCard ? (
                        <UserIcon
                            icon={pfp}
                            status={status}
                            statusBgColor={statusBgColor}
                            statusBgOpacity={1}
                        />
                    ) : (
                        <UserIcon
                            icon={pfp}
                            status={status}
                            statusBgColor={statusBgColor}
                            statusBgOpacity={1}
                        />
                    )}

                    <div className="flex flex-col">
                        <p className="text-white/90 font-medium">{username}</p>
                        <p className="text-sm font med">
                            {pendingCard ? type : customStatus}
                        </p>
                    </div>
                </div>
                <div className="">
                    {pendingCard ? (
                        <div className="flex space-x-4">
                            {type === "Incoming" && (
                                <div
                                    className="w-10 h-10 bg-gray-900 rounded-full hover:text-green-500 flex justify-center items-center transition-colors"
                                    onClick={acceptFriendRequest}
                                >
                                    <FiCheck className="w-6 h-6 relative top-[.5px] font-" />
                                </div>
                            )}
                            <div className="w-10 h-10 bg-gray-900 rounded-full hover:text-red-500 flex justify-center items-center transition-colors">
                                <VscChromeClose className="w-6 h-6 relative top-[.5px]" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex space-x-4">
                            <div
                                className="w-10 h-10 bg-gray-900 rounded-full hover:text-white/90 flex justify-center items-center transition-colors"
                                onClick={openConversation}
                            >
                                <MdMessage className="w-6 h-6 relative top-[.5px]" />
                            </div>
                            <div className="w-10 h-10 bg-gray-900 rounded-full hover:text-white/90 flex justify-center items-center transition-colors">
                                <FiMoreVertical className="w-6 h-6" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendCard;
