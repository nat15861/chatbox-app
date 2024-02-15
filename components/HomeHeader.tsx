import { useSession, signIn } from "next-auth/react";

const HomeHeader = () => {
    const { data } = useSession();
    console.log(data);
    return (
        <div className="h-20 px-4 flex justify-end items-center">
            <div className="text-lg text-white/70 font-medium flex items-center space-x-8">
                <div
                    className="group flex flex-col items-center cursor-pointer"
                    onClick={() =>
                        signIn("google", { callbackUrl: "/create-account" })
                    }
                >
                    <p>Login</p>
                    <div className="w-0 group-hover:w-full h-[3px] rounded-full bg-white/70 transition-all"></div>
                </div>
                <div className="group flex flex-col items-center cursor-pointer">
                    <p>Sign Up</p>
                    <div className="w-0 group-hover:w-full h-[3px] rounded-full bg-white/70 transition-all"></div>
                </div>
            </div>
        </div>
    );
};

export default HomeHeader;
