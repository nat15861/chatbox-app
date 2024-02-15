enum Status {
    Online = 0,
    DoNotDisturb = 1,
    Idle = 2,
    Offline = 3,
}

interface StatusIconProps {
    status: string;
    statusBgColor: string;
    statusBgOpacity: number;
}

const StatusIcon = ({
    status,
    statusBgColor,
    statusBgOpacity,
}: StatusIconProps) => {
    const colorStyle = {
        backgroundColor: statusBgColor,
        opacity: statusBgOpacity,
    };

    return (
        <div
            className="w-[18px] h-[18px] rounded-full flex justify-center items-center overflow-hidden"
            style={colorStyle}
        >
            <div
                className={`w-[12px] h-[12px] rounded-full 
                ${status === "Online" && "bg-green-600"} 
                ${status === "Do Not Disturb" && "bg-red-600"} 
                ${status === "Idle" && "bg-yellow-600"} 
                ${status === "Offline" && "bg-gray-500"} 
                flex justify-center items-center`}
            >
                {status === "Idle" && (
                    <div
                        className="w-2 h-2 rounded-full absolute top-[2px] left-[2px]"
                        style={colorStyle}
                    ></div>
                )}
                {status === "Offline" && (
                    <div
                        className="w-[6px] h-[6px] rounded-full"
                        style={colorStyle}
                    ></div>
                )}
                {status === "Do Not Disturb" && (
                    <div className="w-[8px] h-[2px]" style={colorStyle}></div>
                )}
            </div>
        </div>
    );
};

export default StatusIcon;
