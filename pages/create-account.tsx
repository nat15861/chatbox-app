import { getSession, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ChangeEvent, useState } from "react";
import connectMongo from "../backend/connectMongo";
import { User } from "../schemas/User";

const CreateAccountPage = () => {
    const { data: session } = useSession();

    const [username, setUsername] = useState("");
    const [buttonDisabled, setButtonDisabled] = useState(true);

    const router = useRouter();

    const createAccount = async () => {
        setButtonDisabled(true);

        // You have to stringify the json data, not sure why
        const userResponse = await fetch("/api/users", {
            method: "POST",
            // The body field accepts a string, not an object, so you have to use strinify here and parse in the api function
            body: JSON.stringify({
                name: session?.user?.name,
                username: username,
                email: session?.user?.email,
                pfp: session?.user?.image,
                status: "Online",
                customStatus: "",
                friends: [],
                conversations: [],
            }),
        });

        const user = await userResponse.json();

        // The response object has a lot of properties, so use response.json to return only the body of the response, converted to json
        console.log(user);

        const clientResponse = await fetch("api/clients", {
            method: "POST",
            body: JSON.stringify({
                userId: user._id,
            }),
        });

        const client = await clientResponse.json();

        console.log(client);

        router.push("/");
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newUsername = e.target.value;

        setButtonDisabled(newUsername === "" || newUsername.includes(" "));

        setUsername(newUsername);
    };

    return (
        <div className="w-fit my-10 mx-auto text-white/30 flex flex-col items-center space-y-32">
            <h1 className="w-fit text-8xl font-medium">
                Hello, {session?.user?.name}
            </h1>
            <div className="flex flex-col items-center space-y-8">
                <h1 className="text-4xl font-medium">
                    Please enter a username:
                </h1>
                <input
                    type="text"
                    onChange={handleChange}
                    className=" w-96 h-10 px-2 bg-white/10 rounded-md outline-none text-xl text-white/80 font-medium"
                />
                <button
                    className="w-24 h-12 rounded-md bg-blue-500 disabled:bg-white/40 text-xl font-medium text-white transition-colors"
                    onClick={createAccount}
                    disabled={buttonDisabled}
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default CreateAccountPage;

export async function getServerSideProps(context: any) {
    const session = await getSession(context);

    // If we navigate to this page without being logged in, we should redirect to the home page
    if (!session || !session.user?.email) {
        return {
            redirect: {
                destination: "/home",
                permanent: false,
            },
        };
    }

    // If we navigate to this page when there is already a user with this email adress, we should redirect to the user page

    // next doesn't like trying to use fetch() in serversideprops, so we will just move the api code to here instead
    connectMongo();

    if (await User.exists({ email: session.user.email })) {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }

    return {
        props: {},
    };
}
