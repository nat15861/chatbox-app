import { ConversationInterface, conversations } from "../data/conversations";
import { nullUser } from "../data/users";
import { IConversation } from "../schemas/Conversation";
import { IUser } from "../schemas/User";
import Message from "./Message";
import { useRef, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import {} from "./SidebarLink";
import { conversationState } from "../pages";

const ConversationLog = ({ conversation }: { conversation: IConversation }) => {
    const { members, messages } = conversation;

    const logRef = useRef<HTMLDivElement>(null);

    const [bottomScrolled, setBottomScrolled] = useState(true);

    useEffect(() => {
        if (logRef.current?.scrollHeight && bottomScrolled) {
            logRef.current.scrollTop = logRef.current?.scrollHeight;
        }
    }, [conversation]);

    const handleScroll = () => {
        const thumbPos = logRef.current?.scrollTop;

        const thumbHeight = logRef.current?.getBoundingClientRect().height;

        const maxHeight = logRef.current?.scrollHeight;

        if (thumbPos !== undefined && thumbHeight !== undefined) {
            setBottomScrolled(thumbPos + thumbHeight === maxHeight);
        }
    };

    return (
        <div
            // Flex-nowrap prevents an issue where flex-scroll div doesn't scroll its overflowed content,
            // but instead increases it's own height, taking up space from the surrounding elemnts
            className="m-1 flex flex-col justify-between flex-grow flex-nowrap overflow-y-auto"
            onScroll={handleScroll}
            ref={logRef}
        >
            <div></div>

            <div className="w-full relative flex justify-center">
                <div className="w-[97%] py-3">
                    {messages.map((message, index) => (
                        <Message
                            key={index}
                            message={message}
                            user={
                                members.find(
                                    (member) => member._id === message.sender
                                ) || ({ _id: "error" } as IUser)
                            }
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConversationLog;
