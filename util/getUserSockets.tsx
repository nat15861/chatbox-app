export const getUserSockets = async (userId: string) => {
    const clientResponse = await fetch(`api/clients/${userId}`);

    const client = await clientResponse.json();

    // console.log(client);

    const { sockets }: { sockets: string[] } = client;

    // console.log(sockets);

    return sockets;
};
