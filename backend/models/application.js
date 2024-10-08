import mongoose from "mongoose";

const applySchema = new mongoose.Schema(
  {
    sellerName: {
      type: String,
    },
    storeAddress: {
      type: String,
    },
    sellerDescription: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true,
  }
);

const Apply = mongoose.model("Apply", applySchema);
export default Apply;
