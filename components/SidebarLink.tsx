import { atom, useRecoilState, useSetRecoilState } from "recoil";
import { ConversationInterface } from "../data/conversations";
import { IConversation } from "../schemas/Conversation";
import { conversationState } from "../pages";
import { mainWindowState } from "./MainWindow";

interface SidebarLinkProps {
    type: "CONVERSATION" | "FRIENDS";
    Icon: any;
    text: string;
    subtext?: string;
    conversationIndex?: number;
}

const SidebarLink = ({
    type,
    Icon,
    text,
    subtext,
    conversationIndex,
}: SidebarLinkProps) => {
    // prettier-ignore
    const setConversationState = useSetRecoilState(conversationState);

    const setMainWindowState = useSetRecoilState(mainWindowState);

    const handleClick = async () => {
        if (type === "CONVERSATION") {
            fetchConversation();

            setMainWindowState("CONVERSATION");
        } else if (type === "FRIENDS") {
            setMainWindowState("FRIENDS");

            setConversationState(-1);
        }
        console.log("click");
    };

    const fetchConversation = async () => {
        if (conversationIndex === undefined) return;

        setConversationState(conversationIndex);
    };

    return (
        <div
            className="h-12 px-1 rounded-md hover:bg-gray-800 text-white/70 hover:text-white/80 cursor-pointer flex items-center space-x-4"
            onClick={handleClick}
        >
            {/* move the dimensions to index.js */}
            {Icon}
            <div className="font-medium flex flex-col justify-center space-y-1">
                <p className="text-lg leading-none">{text}</p>
                {subtext && <p className="text-xs leading-none">{subtext}</p>}
            </div>
        </div>
    );
};
export default SidebarLink;
