import { model, models, Schema, SchemaTypes } from "mongoose";
import { atom } from "recoil";
import { IConversation } from "./Conversation";

export interface IUser {
    _id: string;
    name: string;
    username: string;
    email: string;
    pfp: string;
    status: string;
    customStatus: string;
    friends: IFriend[];
    conversations: IConversation[];
}

export interface IFriend {
    type: string;
    _id: string;
    name: string;
    username: string;
    email: string;
    pfp: string;
    status: string;
    customStatus: string;
}

export const UserSchema = new Schema<IUser>({
    name: String,
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    pfp: String,
    status: String,
    customStatus: String,
    friends: [
        {
            friendType: String,
            friendId: { type: SchemaTypes.ObjectId, ref: "User" },
        },
    ],
    conversations: [{ type: SchemaTypes.ObjectId, ref: "Conversation" }],
});

export const User = models.User || model<IUser>("User", UserSchema);
