import Image from "next/image";

const ProfilePicture = ({ icon, size }: { icon: string; size: number }) => {
    return (
        <div style={{ width: size, height: size }}>
            <div className="w-full h-full rounded-full overflow-hidden">
                <Image src={icon} width={size} height={size} />
            </div>
        </div>
    );
};

export default ProfilePicture;
