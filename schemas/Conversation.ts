import { model, models, Schema, SchemaTypes } from "mongoose";
import { atom } from "recoil";
import { IUser } from "./User";

console.log("converstation tsx");

export interface IConversation {
    id: string;
    type: string;
    name: string;
    icon: string;
    status: string;
    customStatus: string;
    // Probably dont need all of the user fields here, just id, username, pfp, and statuses
    members: IUser[];
    messages: IMessage[];
}

export interface IMessage {
    _id: string;
    sender: string;
    body: string;
}

export const ConversationSchema = new Schema<IConversation>({
    type: String,
    name: String,
    icon: String,
    // User ID
    members: [{ type: SchemaTypes.ObjectId, ref: "User" }],
    messages: [
        {
            // User ID
            sender: { type: SchemaTypes.ObjectId, ref: "User" },
            body: String,
        },
    ],
});

// prettier-ignore
export const Conversation = models.Conversation || model<IConversation>("Conversation", ConversationSchema);
