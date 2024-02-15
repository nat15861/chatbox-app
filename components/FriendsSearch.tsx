import { IoSearch } from "react-icons/io5";
import { useRecoilValue } from "recoil";
import { friendsTabState } from "./FriendsHeader";
import FriendsList from "./FriendsList";
import FriendsAdd from "./FriendsAdd";
import { IUser } from "../schemas/User";

const FriendsSearch = ({ user }: { user: IUser }) => {
    const activeFriendsTab = useRecoilValue(friendsTabState);

    const friends = user.friends.filter(({ type, status }) => {
        if (type === "Incoming" || type === "Outgoing") {
            return activeFriendsTab === "Pending";
        }

        //prettier-ignore
        return type === activeFriendsTab || (activeFriendsTab === "Online" && type === "All" && status === "Online");
    });

    return (
        <div className="w-[70%] h-full px-6 py-5 border-r-[2px] border-gray-700 flex flex-col space-y-4">
            {activeFriendsTab === "Add Friend" ? (
                <FriendsAdd userId={user._id} username={user.username} />
            ) : (
                <div>
                    <div className="flex flex-col space-y-7">
                        <div className="w-full h-10 px-2 rounded-md bg-gray-900 flex justify-between items-center">
                            <input
                                className="bg-transparent outline-none flex-grow placeholder-white/70 text-white/80"
                                type="text"
                                placeholder="Search for friends"
                            />
                            <IoSearch className="w-5 h-5 ml-1 cursor-pointer" />
                        </div>
                        <div className="px-2 text-sm font-medium">
                            {activeFriendsTab.toUpperCase()} - {friends.length}
                        </div>
                    </div>
                    <FriendsList friends={friends} />
                </div>
            )}
        </div>
    );
};

export default FriendsSearch;
