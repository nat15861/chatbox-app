import { MdOutlineEmojiPeople } from "react-icons/md";
import FriendsHeaderTab from "./FriendsHeaderTab";
import { useState } from "react";
import { atom, useRecoilState } from "recoil";

export const friendsTabState = atom({
    key: "friendsTabState",
    default: "Online",
});

const deleteAllFriends = async () => {
    const natId = "647bca20ab4cdcd45c0d6273";
    const dionId = "647a3daacaf965cbf5d174bc";

    const natResponse = await fetch(`api/users/${natId}`, {
        method: "POST",
        body: JSON.stringify({
            type: "FILTERED_UPDATE",
            filter: { _id: natId },
            update: { $set: { friends: [] } },
        }),
    });

    natResponse.json().then((natUser) => console.log(natUser));

    const dionResponse = await fetch(`api/users/${dionId}`, {
        method: "POST",
        body: JSON.stringify({
            type: "FILTERED_UPDATE",
            filter: { _id: dionId },
            update: { $set: { friends: [] } },
        }),
    });

    dionResponse.json().then((dionUser) => console.log(dionUser));
};

const FriendsHeader = () => {
    //prettier-ignore
    const [activeFriendsTab, setActiveFriendsTab] = useRecoilState(friendsTabState);

    return (
        <div className="w-full h-[62px] px-4 border-b-2 border-gray-900 flex items-center space-x-3">
            <div className="pr-3 border-r-[1px] border-gray-700 flex items-center space-x-1">
                <MdOutlineEmojiPeople
                    className="w-8 h-8 text-white/50 cursor-pointer"
                    onClick={deleteAllFriends}
                />
                <p className="text-lg text-white/80 font-semibold">Friends</p>
            </div>
            <div className="flex items-center space-x-3">
                <FriendsHeaderTab text={"Online"} />
                <FriendsHeaderTab text={"All"} />
                <FriendsHeaderTab text={"Pending"} />
                <FriendsHeaderTab text={"Blocked"} />
                <FriendsHeaderTab text={"Add Friend"} />
            </div>
        </div>
    );
};

export default FriendsHeader;
