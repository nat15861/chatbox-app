import { MessageInterface, UserInterface } from "../data/conversations";
import { IConversation, IMessage } from "../schemas/Conversation";
import { IUser } from "../schemas/User";
import ProfilePicture from "./ProfilePicture";

// MAYBE PASS IN OBJECTS INSTEAD OF IDS IN THE MEMBERS ARRAY SO WE HAVE ACCES TO THAT INFORMATION
// YOU COULD THEN JUST DO A find() IN THAT ARARY FOR A MATCHING ID TO GET THE NAME AND PFP
const Message = ({ message, user }: { message: IMessage; user: IUser }) => {
    //console.log(user);

    return (
        <div className="w-full h-[60px] flex">
            <div className="h-full py-2">
                <ProfilePicture icon={user.pfp} size={40} />
            </div>
            <div className="px-4 w-full flex flex-col">
                <div>
                    <p className="font-medium hover:underline cursor-pointer">
                        {user.username}
                    </p>
                </div>
                <div>
                    <p className="text-md">{message.body}</p>
                </div>
            </div>
        </div>
    );
};

export default Message;
