import { Schema, model, models } from "mongoose";

export interface IClient {
    userId: string;
    sockets: string[];
}

export const ClientSchema = new Schema<IClient>({
    userId: String,
    sockets: [String],
});

export const Client = models.Client || model<IClient>("Client", ClientSchema);
