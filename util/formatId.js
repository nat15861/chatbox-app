// This function returns a serializble version of the object by converting it's mongoose.ObjectId object to a string
// To do this, it uses the spread operator to make a copy of the object, and replaces the _id field with just the id string using the mongoose.ObjectId.toString() method

export const formatId = (object) => {
    return {
        ...object,
        _id: object._id.toString(),
    };
};
