import Image from "next/image";
import ProfilePicture from "./ProfilePicture";
import StatusIcon from "./StatusIcon";

export interface UserIconProps {
    icon: string;
    status: string;
    statusBgColor: string;
    statusBgOpacity: number;
}

const UserIcon = ({
    icon,
    status,
    statusBgColor,
    statusBgOpacity,
}: UserIconProps) => {
    return (
        <div className="w-8 h-8 relative">
            <ProfilePicture icon={icon} size={32} />
            <div className="absolute bottom-[-4px] right-[-4px]">
                <StatusIcon
                    status={status}
                    statusBgColor={statusBgColor}
                    statusBgOpacity={statusBgOpacity}
                />
            </div>
        </div>
    );
};

export default UserIcon;
