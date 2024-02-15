import { BsFillCameraVideoFill } from "react-icons/bs";
import { FaUserFriends } from "react-icons/fa";
import { MdOutlineEmojiPeople, MdWifiCalling3 } from "react-icons/md";
import { VscMention } from "react-icons/vsc";
import StatusIcon from "./StatusIcon";
import { RiPushpinFill } from "react-icons/ri";
import { IoPersonAddSharp } from "react-icons/io5";

interface ConverstationHeaderProps {
    name: string;
    type: string;
    status?: string;
}

const ConversationHeader = ({
    name,
    type,
    status,
}: ConverstationHeaderProps) => {
    // console.log(status);

    return (
        // Setting min hieght so that the flex-grow conversation log div doesnt take space from the header
        <div className="w-full min-h-[62px] h-[62px] px-4 border-b-2 border-gray-900 flex justify-between items-center">
            <div className="flex items-center space-x-1">
                <div className="flex items-center">
                    {type === "Direct" ? (
                        <VscMention className="mr-[1px] text-3xl stroke-[.4]" />
                    ) : (
                        <FaUserFriends className="mr-2 text-3xl stroke-[.4]" />
                    )}
                    <h1 className="relative -top-1 text-2xl font-medium cursor-default">
                        {name}
                    </h1>
                </div>

                {status && (
                    <StatusIcon
                        status={status}
                        statusBgColor={"#1f2937"}
                        statusBgOpacity={1}
                    />
                )}
            </div>
            <div className="text-2xl flex items-center space-x-5">
                <MdWifiCalling3 className="hover:text-white/90 cursor-pointer" />
                <BsFillCameraVideoFill className="hover:text-white/90 cursor-pointer" />
                <RiPushpinFill className="hover:text-white/90 cursor-pointer" />
                <IoPersonAddSharp className="hover:text-white/90 cursor-pointer" />
            </div>
        </div>
    );
};

export default ConversationHeader;
