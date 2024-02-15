import { BsEmojiSmileFill } from "react-icons/bs";
import { MdOutlineAddCircle } from "react-icons/md";
import { ConversationInterface } from "../data/conversations";
import { FormEvent, KeyboardEvent, useRef, useState, useEffect } from "react";
import { IConversation, IMessage } from "../schemas/Conversation";
import { IUser } from "../schemas/User";
import {} from "./SidebarLink";
import { useRecoilState, useSetRecoilState } from "recoil";
import { emitEventTriggersState, conversationState, userState } from "../pages";

export interface IEventTrigger {
    event: "JOIN_ROOM" | "SEND_UPDATE" | "NONE";
    info: any;
    updater: boolean;
}

const ConversationInput = ({
    user,
    conversation,
}: {
    user: IUser;
    conversation: IConversation;
}) => {
    const setUser = useSetRecoilState(userState);

    const setEmitEventTriggers = useSetRecoilState(emitEventTriggersState);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const submitMessage = async () => {
        if (conversation.type !== "Direct") return;

        // prettier-ignore
        const dbConversationResponse = await fetch(`api/conversations/${conversation.id}`, {
            method: "POST",
            body: JSON.stringify({
                type: "ADD_MESSAGE",
                update: {
                    $push: {
                        messages: {
                            sender: user._id ,
                            body: textareaRef.current?.value
                        }
                    }
                }
            })
        })

        const dbConversation = await dbConversationResponse.json();

        // console.log(dbConversation);

        const newMessage: IMessage =
            dbConversation.messages[dbConversation.messages.length - 1];

        const newConversation: IConversation = {
            ...conversation,
            messages: [...conversation.messages, newMessage],
        };

        console.log(newConversation);
        //console.log(formattedConversation);

        setUser((oldUser) => {
            const conversationIndex = oldUser.conversations.findIndex(
                (userConversation) => userConversation.id === dbConversation._id
            );

            // console.log(conversationIndex);

            const newUser = {
                ...oldUser,
                conversations: [
                    ...oldUser.conversations.slice(0, conversationIndex),
                    newConversation,
                    ...oldUser.conversations.slice(conversationIndex + 1),
                ],
            };

            return newUser;
        });

        setEmitEventTriggers(([{ updater }]) => {
            return [
                {
                    event: "SEND_UPDATE",
                    info: {
                        destination: "ROOM",
                        clientUpdate: {
                            target: dbConversation._id,
                            updateType: "UPDATE_CONVERSATION",
                            content: [
                                {
                                    conversationUpdateType: "PUSH_TO_ARRAY",
                                    conversationId: dbConversation._id,
                                    elementArray: "messages",
                                    newElement: newMessage,
                                },
                            ],
                        },
                    },
                    updater: !updater,
                },
            ];
        });
    };

    const checkSubmit = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // console.log(e.key);

        if (e.key === "Enter") {
            console.log("submitting");
            !e.shiftKey && e.preventDefault();

            submitMessage();

            if (textareaRef.current) textareaRef.current.value = "";
        }
    };

    const handleTextAreaInput = () => {
        // console.log(textareaRef.current?.scrollHeight);
        if (textareaRef.current) {
            textareaRef.current.style.height = "0px";
            textareaRef.current.style.height =
                textareaRef.current.scrollHeight + "px";
        }
    };

    const deleteAllMessages = async () => {
        const conversationResponse = await fetch(
            `api/conversations/${conversation.id}`,
            {
                method: "POST",
                body: JSON.stringify({
                    type: "DELETE_ALL_MESSAGES",
                }),
            }
        );

        //console.log(await conversationResponse.json());

        const conversationJson = await conversationResponse.json();

        console.log(conversationJson);

        const newConversation = {
            ...conversation,
            messages: conversationJson.messages as IMessage[],
        };

        console.log(newConversation);

        // setConversationState(newConversation);
    };

    return (
        <div className="pb-6 h-fit flex justify-center">
            <form className="w-[97%] min-h-[44px] h-fit rounded-lg px-3 py-[10px] bg-slate-700 flex items-start space-x-3">
                <MdOutlineAddCircle
                    className="text-2xl text-white/70 hover:text-white/90 cursor-pointer"
                    onClick={deleteAllMessages}
                />
                <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder={`Message ${conversation.name}`}
                    onKeyDown={checkSubmit}
                    onInput={handleTextAreaInput}
                    className=" flex-grow h-auto bg-transparent outline-none resize-none overflow-hidden flex items-center "
                ></textarea>
                <div className="w-[24px] h-[24px] flex items-center justify-center">
                    <BsEmojiSmileFill className="text-xl text-white/70 hover:text-white/90 cursor-pointer" />
                </div>
            </form>
        </div>
    );
};

export default ConversationInput;
