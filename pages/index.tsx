//prettier-ignore
import { GetServerSideProps, InferGetServerSidePropsType, NextPage} from "next";
import { FaUserFriends } from "react-icons/fa";
import { BsPlusLg } from "react-icons/bs";
import ProfileBox from "../components/ProfileBox";
import ConversationHeader from "../components/ConversationHeader";
import MainWindow from "../components/MainWindow";
import { MdOutlineEmojiPeople } from "react-icons/md";
import { getSession, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import connectMongo from "../backend/connectMongo";
import { IFriend, IUser, User, UserSchema } from "../schemas/User";
import { Document, Types } from "mongoose";
import { formatId } from "../util/formatId";
import {
    atom,
    useRecoilState,
    useRecoilValue,
    useSetRecoilState,
} from "recoil";
import { Conversation, IConversation, IMessage } from "../schemas/Conversation";
import { useEffect, useRef } from "react";
import io from "socket.io-client";
import { Socket } from "socket.io";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import SidebarLink from "../components/SidebarLink";
import SidebarLinkList from "../components/SidebarLinkList";
import { features } from "process";
import { IClientUpdate } from "../components/FriendsAdd";
import { IEventTrigger } from "../components/ConversationInput";
import { getUserSockets } from "../util/getUserSockets";
import ConversationPopup from "../components/ConversationPopup";

let socket: any;

export const userState = atom({
    key: "userState",
    default: {} as IUser,
});

export const conversationState = atom({
    key: "conversationState",
    default: -1,
});

export const emitEventTriggersState = atom({
    key: "emitEventTriggersState",
    default: [{ event: "NONE", updater: true }] as IEventTrigger[],
});

export const socketIdState = atom({
    key: "socketIdState",
    default: "",
});

export const showPopoutState = atom({
    key: "showPopoutState",
    default: false,
});

export const testState = atom({
    key: "testState",
    default: "test",
});

const UserPage = ({ initialUser }: { initialUser: IUser }) => {
    // prettier-ignore
    const [user, setUser] = useRecoilState(userState);

    const setConversationState = useSetRecoilState(conversationState);

    const [emitEventTriggers, setEmitEventTriggers] = useRecoilState(
        emitEventTriggersState
    );

    const [socketId, setSocketId] = useRecoilState(socketIdState);

    const [showPopout, setShowPopout] = useRecoilState(showPopoutState);

    const popoutButtonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initClient = async () => {
            await initSocket();

            setUser(initialUser);
        };

        initClient();

        console.log(emitEventTriggers[0]);
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.removeAllListeners();

        addSocketListeners();
    }, [user]);

    useEffect(() => {
        // prettier-ignore
        if (emitEventTriggers.length === 0 || emitEventTriggers[0].event === "NONE") return;

        emitEventTriggers.forEach((emitEventTrigger) => {
            console.log("Emitting event to server: ", emitEventTrigger);

            const { event, info: eventInfo } = emitEventTrigger;

            if (event === "JOIN_ROOM") {
                socket.emit("join_room", eventInfo.room);
            } else if (event === "SEND_UPDATE") {
                if (eventInfo.destination === "CLIENT") {
                    socket.emit("send_client_update", eventInfo.clientUpdate);
                } else if (eventInfo.destination === "ROOM") {
                    socket.emit("send_room_update", eventInfo.clientUpdate);
                }
            }
        });
    }, [emitEventTriggers]);

    const updateSever = async () => {
        console.log("updating server");

        await fetch("api/socket", {
            method: "POST",
            body: JSON.stringify({ action: "UPDATE_SERVER" }),
        });
    };

    const initSocket = async () => {
        await updateSever();

        socket = io();

        addSocketListeners();

        joinInitialRooms();
    };

    const addSocketListeners = () => {
        socket.on("connect", () => {
            console.log("socket connected with id", socket.id);

            setSocketId(socket.id);
        });

        socket.on("info", (info: string) => {
            console.log("INFO:");
            console.log(info);
        });

        socket.on("appear_online", async () => {
            console.log("appearing online");

            console.log(emitEventTriggers);

            const [{ updater }] = emitEventTriggers;

            console.log(updater);

            // Lot going on here, basically we need to send updates to every socket for every friend
            // For every trigger, we also need to get the previous trigger to make sure the updater value is always opposite to ensure the trigger state is updated
            // To do this we will use reduce so we have the value of the preivous trigger, and then in each friend iteration we will map that friend's sockets to trigger arrays
            const friendTriggers: IEventTrigger[] =
                // We need to await here since we are awaiting down below
                await initialUser.friends.reduce(
                    // We need to async this for the same reason
                    async (accumulator, currentValue, currentIndex) => {
                        // Get the friend's sockets
                        const friendSockets = await getUserSockets(
                            currentValue._id
                        );

                        const currentTriggers = await accumulator;

                        // If this is the first friend, the accumulator (trigger) array will be empty so the first updater value should be opposite to the last value in the trigger state
                        // Otherwise, since we have an array of the triggers we have created so far, just set the first udpater to be opposite of the updater value on the last trigger
                        //prettier-ignore

                        console.log(currentIndex, updater);

                        console.log(currentTriggers);

                        const test = !updater;

                        const firstUpdater =
                            currentIndex === 0
                                ? !updater
                                : !currentTriggers[currentTriggers.length - 1]
                                      ?.updater;

                        // For each socket, return a trigger
                        const friendSocketTriggers: IEventTrigger[] =
                            friendSockets.map((socket, index) => {
                                return {
                                    event: "SEND_UPDATE",
                                    info: {
                                        destination: "CLIENT",
                                        clientUpdate: {
                                            target: socket,
                                            updateType: "UPDATE_FRIEND",
                                            content: {
                                                friendId: initialUser._id,
                                                updateInfo: {
                                                    status: "Online",
                                                },
                                            },
                                        },
                                    },
                                    // Since we know what the first socket updater value should be, we know what the values should be for all the even and odd indexes
                                    // prettier-ignore
                                    updater: index % 2 === 0 ? firstUpdater : !firstUpdater,
                                } as IEventTrigger;
                            });

                        // console.log(friendSocketTriggers);

                        // Destructure the current triggers and the new ones to create a new trigger array to pass on to the next friend
                        return [...currentTriggers, ...friendSocketTriggers];
                    },
                    // This is similar to await Promise.all()
                    // Each iteration is supposed to return a trigger array, but since we have to make the function async because of the db calls, we end up returning promises instead
                    // This just does some fancy stuff to make sure everything resolves correctly and the correct types are returned
                    Promise.resolve([] as IEventTrigger[])
                );
            console.log(friendTriggers);

            const conersationTriggers: IEventTrigger[] =
                // We need to await here since we are awaiting down below
                await initialUser.conversations.reduce(
                    // We need to async this for the same reason
                    async (accumulator, currentValue, currentIndex) => {
                        const currentTriggers = await accumulator;

                        let initialContent: any[] = [];

                        if (currentValue.type === "Direct") {
                            initialContent = [
                                {
                                    conversationUpdateType: "UPDATE_ATTRIBUTE",
                                    conversationId: currentValue.id,
                                    conversationUpdate: {
                                        status: "Online",
                                    },
                                },
                            ];
                        }

                        // For each socket, return a trigger
                        const conversationTrigger: IEventTrigger = {
                            event: "SEND_UPDATE",
                            info: {
                                destination: "ROOM",
                                clientUpdate: {
                                    target: currentValue.id,
                                    updateType: "UPDATE_CONVERSATION",
                                    content: [
                                        ...initialContent,
                                        {
                                            // prettier-ignore
                                            conversationUpdateType: "UPDATE_ARRAY_ELEMENT",
                                            conversationId: currentValue.id,
                                            elementArray: "members",
                                            elementId: initialUser._id,
                                            conversationUpdate: {
                                                status: "Online",
                                            },
                                        },
                                    ],
                                },
                            },
                            // Since we know what the first socket updater value should be, we know what the values should be for all the even and odd indexes
                            // prettier-ignore
                            updater:
                                currentIndex === 0
                                    ? friendTriggers.length === 0
                                        ? !updater
                                        : !friendTriggers[friendTriggers.length - 1].updater
                                    : !currentTriggers[currentTriggers.length - 1].updater,
                        };

                        // console.log(conversationTrigger);

                        // Destructure the current triggers and the new ones to create a new trigger array to pass on to the next friend
                        return [...currentTriggers, conversationTrigger];
                    },
                    // This is similar to await Promise.all()
                    // Each iteration is supposed to return a trigger array, but since we have to make the function async because of the db calls, we end up returning promises instead
                    // This just does some fancy stuff to make sure everything resolves correctly and the correct types are returned
                    Promise.resolve([] as IEventTrigger[])
                );

            console.log(conersationTriggers);

            const newTriggers = [...friendTriggers, ...conersationTriggers];

            newTriggers.length !== 0 && setEmitEventTriggers(newTriggers);
        });

        socket.on("update", async (update: IClientUpdate) => {
            console.log("Recieved an update from the server");

            console.log(update);

            const { updateType } = update;

            if (updateType === "ADD_FRIEND") {
                const { content: newFriend }: { content: IFriend } = update;

                console.log("Adding friend: ", newFriend);

                setUser((oldUser) => {
                    return {
                        ...oldUser,
                        friends: [...oldUser.friends, newFriend],
                    };
                });
            } else if (updateType === "UPDATE_FRIEND") {
                console.log("recieved update friend event!");

                const { friendId, updateInfo } = update.content;

                const fields = Object.keys(updateInfo);

                const values = Object.values(updateInfo);

                // Loops through all of the fields and values and constructs an object of key value pairs
                const attributeUpdates = fields.reduce(
                    (accumulator, currentValue, currentIndex) => {
                        // console.log(currentIndex);
                        return {
                            ...accumulator,
                            [currentValue]: values[currentIndex],
                        };
                    },
                    {}
                );

                // console.log(attributeUpdates);

                setUser((oldUser) => {
                    // First we grab the index of the friend that we need to modify
                    const friendIndex = oldUser.friends.findIndex((friend) => {
                        return friend._id === friendId;
                    });

                    // Then we recreate that object with the updated attributes
                    const newFriend = {
                        ...oldUser.friends[friendIndex],
                        // Computed key like before
                        ...attributeUpdates,
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

                    console.log(newUser);

                    return newUser;
                });
            } else if (updateType === "ADD_CONVERSATION") {
                console.log("caught new add conversation event!");

                const { content: conversation } = update;

                console.log(user);
                console.log(user._id);

                setUser((oldUser) => {
                    return {
                        ...oldUser,
                        conversations: [...oldUser.conversations, conversation],
                    };
                });

                // We want to grab updater off of the first trigger in the array
                // We can do this by making an array of commas and variable names where each name will correspond to an array element depending on its index in this new array
                // But since we only want the first element we could just put a variable name surrounded by brackets, and that would return just that element
                // And once we have that element, we can just destructure it to get the updater variable
                setEmitEventTriggers(([{ updater }]) => {
                    return [
                        {
                            event: "JOIN_ROOM",
                            info: {
                                room: conversation.id,
                            },
                            updater: !updater,
                        },
                    ];
                });
            } else if (updateType === "UPDATE_CONVERSATION") {
                console.log("recieved update conversation event! ");

                update.content.forEach((updateContent: any) => {
                    const { conversationUpdateType, conversationId } =
                        updateContent;

                    if (conversationUpdateType === "UPDATE_ATTRIBUTE") {
                        const { conversationUpdate } = updateContent;

                        console.log(conversationUpdate);

                        const field = Object.keys(conversationUpdate)[0];
                        const value = Object.values(conversationUpdate)[0];

                        setUser((oldUser) => {
                            const { conversations } = oldUser;

                            const conversationIndex = conversations.findIndex(
                                (conversation) =>
                                    conversation.id === conversationId
                            );

                            //prettier-ignore
                            const oldConversation = conversations[conversationIndex];

                            const newConversation = {
                                ...oldConversation,
                                [field]: value,
                            };

                            const newUser = {
                                ...oldUser,
                                conversations: [
                                    ...conversations.slice(
                                        0,
                                        conversationIndex
                                    ),
                                    newConversation,
                                    ...conversations.slice(
                                        conversationIndex + 1
                                    ),
                                ],
                            };

                            console.log(newUser);

                            return newUser;
                        });
                    } else if (
                        conversationUpdateType === "UPDATE_ARRAY_ELEMENT"
                    ) {
                        console.log("update array element");

                        const { conversationUpdate, elementId } = updateContent;

                        console.log(conversationUpdate);

                        // console.log(conversationUpdateType);
                        // console.log(conversationId);
                        // console.log(conversationUpdate);
                        // console.log(elementId);

                        // We need to use elementArray as a dynamic key so that the string stored in the variable is used as a key instead of the variable name itself
                        // To do this we need to add this keyof thing to "verify" that the string in this variable will acutally be a key on IConversation
                        // prettier-ignore
                        const { elementArray }: { elementArray: keyof IConversation } = updateContent;

                        // console.log(elementArray);

                        const field = Object.keys(conversationUpdate)[0];
                        const value = Object.values(conversationUpdate)[0];

                        // console.log(field);
                        // console.log(value);

                        setUser((oldUser) => {
                            const { conversations } = oldUser;

                            const conversationIndex = conversations.findIndex(
                                (conversation) =>
                                    conversation.id === conversationId
                            );

                            //prettier-ignore
                            const oldConversation = conversations[conversationIndex];

                            // console.log(oldConversation);

                            // Now we can use the dynamic key in []s to destructure the property off of the conversation object
                            // For some reason, if we want to do this, we have to give the key an alias and call it something else
                            const { [elementArray]: elementArr } =
                                oldConversation;

                            // console.log(elementArr);

                            if (typeof elementArr === "string") {
                                //prettier-ignore
                                console.error("elementArray key was a string when it was supposed to be an array of interfaces for conversation update type UPDATE_ARRAY_ELEMENT!");

                                return oldUser;
                            }

                            // Find the index of the element that we want to change using the element's id
                            const elementIndex = elementArr.findIndex(
                                (element) => {
                                    return element._id === elementId;
                                }
                            );

                            // console.log(elementIndex)

                            // Grab the element
                            const oldElement = elementArr[elementIndex];

                            // console.log(oldElement);

                            // Create a new element with the new attribute that we want to update
                            const newElement = {
                                ...oldElement,
                                [field]: value,
                            };

                            // console.log(newElement);

                            // Create a new conversation, splicing the new element into the correct array
                            const newConversation = {
                                ...oldConversation,
                                [elementArray]: [
                                    ...elementArr.slice(0, elementIndex),
                                    newElement,
                                    ...elementArr.slice(elementIndex + 1),
                                ],
                            };

                            // console.log(newConversation);

                            // Create a new user, splicing in the new conversation
                            const newUser = {
                                ...oldUser,
                                conversations: [
                                    ...conversations.slice(
                                        0,
                                        conversationIndex
                                    ),
                                    newConversation,
                                    ...conversations.slice(
                                        conversationIndex + 1
                                    ),
                                ],
                            };

                            console.log(newUser);

                            // Return the new user
                            return newUser;
                        });
                    } else if (conversationUpdateType === "PUSH_TO_ARRAY") {
                        // prettier-ignore
                        const { elementArray, newElement }: { elementArray: keyof IConversation, newElement: any } = updateContent;

                        setUser((oldUser) => {
                            const { conversations } = oldUser;

                            const conversationIndex = conversations.findIndex(
                                (conversation) =>
                                    conversation.id === conversationId
                            );

                            //prettier-ignore
                            const oldConversation = conversations[conversationIndex];

                            // Now we can use the dynamic key in []s to destructure the property off of the conversation object
                            // For some reason, if we want to do this, we have to give the key an alias and call it something else
                            // prettier-ignore
                            const { [elementArray]: elementArr } = oldConversation;

                            if (typeof elementArr === "string") {
                                //prettier-ignore
                                console.error("elementArray key was a string when it was supposed to be an array of interfaces for conversation update type PUSH_TO_ARRAY!");

                                return oldUser;
                            }

                            const newArray = [...elementArr, newElement];

                            // console.log(newArray);

                            const newConversation = {
                                ...oldConversation,
                                [elementArray]: newArray,
                            };

                            const newUser = {
                                ...oldUser,
                                conversations: [
                                    ...oldUser.conversations.slice(
                                        0,
                                        conversationIndex
                                    ),
                                    newConversation,
                                    ...oldUser.conversations.slice(
                                        conversationIndex + 1
                                    ),
                                ],
                            };

                            console.log(newUser);

                            return newUser;
                        });
                    }
                });
            }
        });

        socket.on("test", () => {
            console.log("Recieved test event from the server");

            socket.emit("test");
        });
    };

    const joinInitialRooms = () => {
        socket.emit("join_default_room");

        socket.emit("register_client", initialUser._id);

        initialUser.conversations.forEach((conversation) => {
            socket.emit("join_room", conversation.id);
        });
    };

    const doSocketStuff = () => {
        console.log(socket.id);

        // add this socket to a room
        socket.emit("join_room", "new_room3");
    };

    const printTest = () => {
        console.log(user);
        console.log(socket);
    };

    const addConversation = async () => {
        const response = await fetch("api/conversations", {
            method: "POST",
            body: JSON.stringify({
                type: "Direct",
                members: [
                    "63acbd95e8da7da51be7d459",
                    "63acbdc7e8da7da51be7d45e",
                ],
            }),
        });

        const { members, conversationId } = await response.json();

        //console.log(members);

        for (let i = 0; i < members.length; i++) {
            const userResponse = await fetch(`api/users/${members[i]}`, {
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

            const user = await userResponse.json();

            console.log(user);
        }
    };

    const addFriend = async () => {
        //const response = await fetch(`api/users/`)
    };

    return JSON.stringify(user) === "{}" ? (
        <div></div>
    ) : (
        <div className="w-screen h-full rounded-md flex overflow-hidden">
            <div className="w-[260px] flex flex-col">
                <div className="border-b-2 border-gray-700">
                    <h1
                        className="-mt- px-4 py-[10px] text-4xl text-white/90 font-medium cursor-pointer cursor- default"
                        onClick={updateSever}
                    >
                        gossip
                    </h1>
                </div>

                <div className="h-full flex flex-col justify-between">
                    <div className="bg-gray-900 p-4 flex flex-col">
                        <div className="h-full text-white/90 mt-2 flex flex-col">
                            <SidebarLink
                                type="FRIENDS"
                                // prettier-ignore
                                Icon={<MdOutlineEmojiPeople className="w-8 h-8" />}
                                text="Friends"
                                // subtext="Friends subtext"
                            />
                            <div className="mt-4 relative text-xs text-white/70 font-bold">
                                <div className="flex justify-between items-center">
                                    <p
                                        className="cursor-pointer cursor -default"
                                        onClick={() => {
                                            //doSocketStuff
                                            printTest();
                                        }}
                                    >
                                        DIRECT MESSAGES
                                    </p>
                                    <div tabIndex={0} ref={popoutButtonRef}>
                                        <BsPlusLg
                                            className="w-[14px] h-[14px] hover:text-white/90 cursor-pointer"
                                            onClick={() => {
                                                setShowPopout(
                                                    (oldValue) => !oldValue
                                                );
                                            }}
                                        />
                                    </div>
                                </div>

                                {showPopout && (
                                    <div className="absolute left-52 top-6">
                                        <ConversationPopup
                                            friends={user.friends}
                                            buttonRef={popoutButtonRef}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                <SidebarLinkList
                                    conversations={user.conversations}
                                />
                            </div>
                        </div>
                    </div>
                    <ProfileBox user={user} />
                </div>
            </div>
            <MainWindow user={user} />
        </div>
    );
};

export default UserPage;

//: GetServerSideProps
export const getServerSideProps = async (context: any) => {
    const session = await getSession(context);

    // If we are not signed in, redirect to home page
    if (!session) {
        return {
            redirect: {
                destination: "/home",
                permanent: false,
            },
        };
    }

    // Because next doesn't like calling fetch() server side, the api logic is instead run here directly
    connectMongo();

    // If we are signed in, but we haven't made a user account yet, redirect to account creation page
    if (!(await User.exists({ email: session.user?.email }))) {
        return {
            redirect: {
                destination: "/create-account",
                permanent: false,
            },
        };
    }

    // The actual user object is stored on the _doc property in the object that is returned by findOne, and there are also additional fields on that object that we do not need
    // The lean function gets rid of all that junk and just returns the contents of the _doc field as a single object
    // We will also modify the database user so that the status is set to online since we are logging in
    const res = await User.findOneAndUpdate(
        { email: session.user?.email },
        { status: "Online" },
        { new: true }
    ).lean();

    // The user object contains a mongoose ObjectId which is not seriziable and cant be turned into json by nextjs
    // So we will format the object so that the ObjectId is converted to a string
    const dbUser = formatId(res);

    console.log(dbUser);

    // console.log(dbUser._id);

    console.log("grabbing convos");

    // Because the async function is run for multiple items in the array, javascript returns an array of promises which messes everything up
    // Calling Promise.all waits for everything to finish and then returns one promise that we can await to get our array with the correct data

    // Since the db user just stores ids, for each id we just look at the database to get the relevant information
    const conversations: IConversation[] = await Promise.all(
        dbUser.conversations.map(async (conversationId: Types.ObjectId) => {
            // prettier-ignore
            const { type, members, messages } = await Conversation.findById(conversationId).lean();

            const populatedMembers: IUser[] = await Promise.all(
                members.map(async (memberId: Types.ObjectId) => {
                    // console.log(memberId);

                    // prettier-ignore
                    const { username, pfp, status, customStatus } = await User.findById(memberId);

                    return {
                        _id: memberId.toString(),
                        username,
                        pfp,
                        status,
                        customStatus,
                    };
                })
            );

            //console.log(messages);

            const formattedMessages: IMessage = messages.map(
                (message: { sender: Types.ObjectId }) => {
                    return formatId({
                        ...message,
                        sender: message.sender.toString(),
                    });
                }
            );

            // console.log("hi");
            // console.log(formattedMessages);
            // console.log("there");
            if (type === "Direct") {
                // prettier-ignore
                // The because the conversation type is direct, base the clinet side conversation properties on the only other member
                const recipientId = members[0].toString() === dbUser._id ? members[1] : members[0];

                const recipient = await User.findById(recipientId);

                return {
                    id: conversationId.toString(),
                    type,
                    name: recipient.username,
                    icon: recipient.pfp,
                    status: recipient.status,
                    customStatus: recipient.customStatus,
                    members: populatedMembers,
                    messages: formattedMessages,
                };
            }

            return {};
        })
    );

    console.log("done grabbing convos");

    console.log(conversations);
    // console.log(conversations[0].members);

    //prettier-ignore
    const friends: IFriend[] = await Promise.all(dbUser.friends.map(async ({friendType, friendId}: {friendType: string, friendId: Types.ObjectId}) => {
        const {_id, name, username, email, pfp, status, customStatus} = await User.findById(friendId); 

        return{
            type: friendType,
            _id: _id.toString(),
            name,
            username, 
            email,
            pfp,
            status,
            customStatus
        }
    }));

    console.log("done grabbing friends");

    console.log(friends);

    //console.log(conversations);

    // The conversations array has ObjectIds which are not compatable with json serialization, so we would have to convert them to strings to pass them in serversideprops
    // But since we already have the coneversations array, we dont need the user.converstations array anymore so we can just delete it for simplicity
    const user: IUser = {
        ...dbUser,
        friends,
        conversations,
    };

    // console.log(user.conversations[0].messages[0]);

    return {
        props: {
            initialUser: user,
        },
    };
};
