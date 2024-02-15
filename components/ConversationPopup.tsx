import { useSetRecoilState } from "recoil";
import { showPopoutState } from "../pages";
import { RefObject, useEffect, useRef } from "react";
import { IFriend } from "../schemas/User";

const ConversationPopup = ({
    buttonRef,
    friends,
}: {
    buttonRef: RefObject<HTMLDivElement>;
    friends: IFriend[];
}) => {
    const setShowPopout = useSetRecoilState(showPopoutState);

    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        divRef.current?.focus();
    }, []);

    return (
        <div
            ref={divRef}
            className="relative"
            onBlur={(e) => {
                // prettier-ignore
                // Close the popout unless we got blurred because a child element was clicked, and unless we clicked on the popout button (the button itself will handle that)
                if (!e.currentTarget.contains(e.relatedTarget) && e.relatedTarget !== buttonRef.current) {
                    console.log("hi?");
                    setShowPopout(false);
                }
            }}
            tabIndex={0}
        >
            <div className="w-96 h-72 absolute z-50 p-4 rounded-md bg-gray-800 border border-black shadow shadow-black flex flex-col space-y-2">
                <p className="text-lg font-medium">Select Friends</p>
                <div className="w-full h-8 px-2 rounded-md bg-gray-900 flex items-center">
                    <input
                        type="text"
                        placeholder="Type the username of a friend"
                        className="w-full bg-transparent outline-none text-sm font-normal"
                    />
                </div>
                <div className="w-full overflow-y-hidden selection:flex flex-col">
                    {friends.map((friend) => (
                        <div className="w-full rounded-sm flex"></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConversationPopup;
