const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    
    role: {
      type: String,
      enum: ["admin", "engineer", "technician"],
      required: [true, "Role is required"],
    },
    //hethi zeda jdida zedtha teb3a active/desactive
    previousAssignedSites: [{ type: String }],
    //njm nfase5 li fou9i
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedSites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Site",
      },
    ],
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Number,
    },
  },
  { timestamps: true }
);


userSchema.virtual("confirmPassword")
    .get(()=>this._confirmPassword)
    .set(value=>this._confirmPassword=value)

module.exports = mongoose.model("User", userSchema);