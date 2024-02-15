import { atom, useRecoilValue } from "recoil";
import { ConversationInterface } from "../data/conversations";
import ConversationHeader from "./ConversationHeader";
import ConversationLog from "./ConversationLog";
import ConversationInput from "./ConversationInput";
import { IConversation } from "../schemas/Conversation";
import { IUser } from "../schemas/User";
import {} from "./SidebarLink";
import { conversationState } from "../pages";
import FriendsHeader from "./FriendsHeader";
import FriendsSearch from "./FriendsSearch";

export const mainWindowState = atom({
    key: "mainWindowState",
    default: "NULL",
});

const MainWindow = ({ user }: { user: IUser }) => {
    const { conversations } = user;

    const windowState = useRecoilValue(mainWindowState);

    const conversationIndex = useRecoilValue(conversationState);

    const activeConversation = conversations[conversationIndex];

    //console.log(conversation);
    return (
        <div className="flex-grow h-full z-auto bg-gray-800 text-white/70">
            {windowState === "CONVERSATION" && (
                <div className="h-full flex flex-col">
                    <ConversationHeader
                        name={activeConversation.name}
                        type={activeConversation.type}
                        // prettier-ignore
                        status={activeConversation.type === "Direct" ? activeConversation.status : undefined}
                    />

                    <ConversationLog conversation={activeConversation} />
                    <ConversationInput
                        user={user}
                        conversation={activeConversation}
                    />
                </div>
            )}
            {windowState === "FRIENDS" && (
                <div className="h-full flex flex-col">
                    <FriendsHeader />
                    <div className=" flex-grow flex">
                        <FriendsSearch user={user} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainWindow;
