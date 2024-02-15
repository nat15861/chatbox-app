import UserIcon from "./UserIcon";
import { IoMdSettings } from "react-icons/io";
import { signOut } from "next-auth/react";
import { IUser } from "../schemas/User";
const ProfileBox = ({
    user: { username, pfp, status, customStatus },
}: {
    user: IUser;
}) => {
    const subtext = customStatus === "" ? status : customStatus;

    return (
        <div className="h-14 px-4  bg-black flex items-center">
            <div className="w-full flex justify-between items-center">
                <div className="flex space-x-2">
                    <UserIcon
                        icon={pfp}
                        status={status}
                        statusBgColor="#000"
                        statusBgOpacity={1}
                    />
                    <div className="text-white/70 font-medium flex flex-col space-y-1">
                        <p className="text-lg leading-none cursor-default">
                            {username}
                        </p>
                        <input
                            type="text"
                            placeholder={subtext}
                            className="bg-transparent outline-none text-xs leading-none placeholder-white/70"
                        />
                    </div>
                </div>
                <div className="text-white/70 text-xl cursor-pointer">
                    <IoMdSettings onClick={() => signOut()} />
                </div>
            </div>
        </div>
    );
};

export default ProfileBox;
