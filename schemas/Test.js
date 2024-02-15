import { model, models, Schema } from "mongoose";

const testSchema = new Schema({
    name: String,
    age: Number,
    height: Number,
});

// If there is already a test model existing, use that, otherwise create it
export const Test = models.Test || model("Test", testSchema);
