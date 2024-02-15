import HomeHeader from "../components/HomeHeader";

const HomePage = () => {
    return (
        <div className="h-full flex flex-col">
            <HomeHeader />
            <div className="flex-grow flex justify-center items-center">
                <h1 className="relative -top-10 text-9xl text-white/20 font-medium">
                    gossip
                </h1>
            </div>
        </div>
    );
};

export default HomePage;
