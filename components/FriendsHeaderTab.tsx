import { useState } from "react";
import { useRecoilState } from "recoil";
import { friendsTabState } from "./FriendsHeader";

const FriendsHeaderTab = ({ text }: { text: string }) => {
    //prettier-ignore
    const [activeFriendsTab, setActiveFriendsTab] = useRecoilState(friendsTabState);

    const addTab = text === "Add Friend";

    // console.log(addTab);

    return (
        <div
            className={`px-2 rounded-md ${
                activeFriendsTab === text
                    ? addTab
                        ? "text-green-400"
                        : "hover:bg-white/5 bg-white/10 text-white/80"
                    : addTab
                    ? "bg-green-600 text-white/90"
                    : "hover:bg-white/5 text-white/60 hover:text-white/70"
            }  font-medium cursor-pointer`}
            onClick={() => {
                setActiveFriendsTab(text);
            }}
        >
            {text}
        </div>
    );
};

export default FriendsHeaderTab;
