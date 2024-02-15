import { useState, ChangeEvent } from "react";
import { IFriend, IUser } from "../schemas/User";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { emitEventTriggersState, socketIdState, userState } from "../pages";
import { getUserSockets } from "../util/getUserSockets";
import { IEventTrigger } from "./ConversationInput";

export interface IClientUpdate {
    target: string;
    updateType: string;
    content: any;
}

const FriendsAdd = ({
    userId,
    username,
}: {
    userId: string;
    username: string;
}) => {
    const [buttonDisabled, setButtonDisabled] = useState(true);

    const [inputFocused, setInputFocused] = useState(false);

    const [hideErrorText, setHideErrorText] = useState(true);

    const [confirmRequest, setConfirmRequest] = useState(false);

    const [sendingRequest, setSendingRequest] = useState(false);

    const [inputUsername, setInputUsername] = useState("");

    const setEmitEventTriggers = useSetRecoilState(emitEventTriggersState);

    // const emitEventTriggers = useRecoilValue(emitEventTriggersState);

    const setUser = useSetRecoilState(userState);

    const socketId = useRecoilValue(socketIdState);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputUsername(e.target.value);

        setHideErrorText(true);

        setConfirmRequest(false);

        //prettier-ignore
        setButtonDisabled(e.target.value === "" || e.target.value.includes(" ") || e.target.value === username);
    };

    const checkUser = async (testUsername: string) => {
        const userResponse = await fetch(`api/users/search/${testUsername}`);

        const { user } = await userResponse.json();

        return user;
    };

    const sendFriendRequest = async () => {
        setSendingRequest(true);

        // Figure out if a user with the entered username actually exists
        const foundUser: IUser = await checkUser(inputUsername);

        console.log(foundUser);

        if (foundUser === null) {
            setInputFocused(true);

            setButtonDisabled(true);

            setHideErrorText(false);

            return;
        }

        // Also need to check if we already have a friend request already outgoing (or maybe incoming) to that person

        //Update sender database document with new friend with type incoming/outgoing
        const userResponse = await fetch(`api/users/${userId}`, {
            method: "POST",
            body: JSON.stringify({
                type: "UPDATE",
                update: {
                    $push: {
                        friends: {
                            friendType: "Outgoing",
                            friendId: foundUser._id,
                        },
                    },
                },
            }),
        });

        const user = await userResponse.json();

        console.log(user);

        // Create a new friend object for the client
        const newFriend: IFriend = {
            type: "Outgoing",
            _id: foundUser._id,
            name: foundUser.name,
            username: foundUser.username,
            email: foundUser.email,
            pfp: foundUser.pfp,
            status: foundUser.status,
            customStatus: foundUser.customStatus,
        };

        // Update the client with the object using recoil
        setUser((oldUser) => {
            return {
                ...oldUser,
                friends: [...oldUser.friends, newFriend],
            };
        });

        const userSockets = await getUserSockets(userId);

        setEmitEventTriggers((oldTriggers) => {
            // console.log(emitEventTriggers);
            console.log(oldTriggers);

            const [{ updater }] = oldTriggers;

            console.log(socketId);

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
                                updateType: "ADD_FRIEND",
                                content: newFriend,
                            },
                        },
                        // The first trigger should not be equal to the original updater, the second trigger should be equal to the orignal updater, and so on
                        updater: indexRemainder === 0 ? !updater : updater,
                    };

                    return newTrigger;
                });

            console.log(newTriggers);

            return newTriggers.length === 0 ? oldTriggers : newTriggers;
        });

        // Checking for connected sockets for the other user
        const recipientSockets = await getUserSockets(foundUser._id);

        const recipientResponse = await fetch(`api/users/${foundUser._id}`, {
            method: "POST",
            body: JSON.stringify({
                type: "UPDATE",
                update: {
                    $push: {
                        friends: {
                            friendType: "Incoming",
                            friendId: userId,
                        },
                    },
                },
            }),
        });

        const recipient = await recipientResponse.json();

        console.log(recipient);

        // If the user is offline, return
        if (recipientSockets.length === 0) {
            setConfirmRequest(true);

            setSendingRequest(false);

            return;
        }

        // If the user is online, we will also send the new information to them directly
        const recipeintFriendInfo: IFriend = {
            type: "Incoming",
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            pfp: user.pfp,
            status: user.status,
            customStatus: user.customStatus,
        };

        console.log(recipeintFriendInfo);

        // Trigger update event with information that we need to send to the other user

        // **** FIGURE OUT HOW TO HANDLE SENDING TO MULTPLE SOCKETS AT ONCE ****

        console.log(recipientSockets);

        setEmitEventTriggers(([{ updater }]) => {
            const newTriggers = recipientSockets.map((socket, index) => {
                const indexRemainder = index % 2;

                const newTrigger: IEventTrigger = {
                    event: "SEND_UPDATE",
                    info: {
                        destination: "CLIENT",
                        clientUpdate: {
                            target: socket,
                            updateType: "ADD_FRIEND",
                            content: recipeintFriendInfo,
                        },
                    },
                    // The first trigger should not be equal to the original updater, the second trigger should be equal to the orignal updater, and so on
                    updater: indexRemainder === 0 ? !updater : updater,
                };

                return newTrigger;
            });

            console.log(newTriggers);

            return newTriggers;
        });

        setConfirmRequest(true);

        setSendingRequest(false);
    };

    return (
        <div className="flex flex-col space-y-3">
            <div className="flex space-x-4">
                <div
                    className={`flex-grow h-10 px-2 rounded-md bg-gray-900 border ${
                        inputFocused
                            ? buttonDisabled
                                ? "border-red-500"
                                : "border-green-500"
                            : "border-gray-900"
                    } transition-colors flex justify-between items-center`}
                >
                    <input
                        className="bg-transparent outline-none flex-grow placeholder-white/70 text-white/80"
                        type="text"
                        placeholder="Enter a username"
                        onChange={handleChange}
                        onFocus={() => {
                            setInputFocused(true);
                            setConfirmRequest(false);
                        }}
                        onBlur={() => setInputFocused(false)}
                    />
                </div>
                <button
                    className="w-[170px] h-10 rounded-md bg-blue-600 disabled:bg-blue-400 hover:bg-blue-700 transition-colors disabled:text-white/100 text-white/90 font-medium cursor-pointer disabled:cursor-default"
                    disabled={buttonDisabled || sendingRequest}
                    onClick={sendFriendRequest}
                >
                    Send Friend Request
                </button>
            </div>
            <div className="flex justify-between">
                <p className="relative left-[2px] text-sm">
                    Send a friend request to add a friend!
                </p>

                {confirmRequest ? (
                    <p className="relative left-[2px] text-sm text-green-400">
                        Sucessfully sent friend request to {inputUsername}!
                    </p>
                ) : (
                    <p
                        className={`relative left-[2px] text-sm text-red-400 ${
                            hideErrorText && "hidden"
                        }`}
                    >
                        User with that name not found!
                    </p>
                )}
            </div>
        </div>
    );
};

export default FriendsAdd;
