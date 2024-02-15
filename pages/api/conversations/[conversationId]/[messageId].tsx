import { NextApiRequest, NextApiResponse } from "next";

const handler = (req: NextApiRequest, res: NextApiResponse) => {
    console.log(req.query);

    if (req.method === "POST") {
    }

    res.end();
};

export default handler;
