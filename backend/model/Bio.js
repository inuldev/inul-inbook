const mongoose = require("mongoose");

const bioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    about: {
      type: String,
      default: "",
    },
    work: [
      {
        company: String,
        position: String,
        startDate: Date,
        endDate: Date,
        current: Boolean,
        description: String,
      },
    ],
    education: [
      {
        school: String,
        degree: String,
        field: String,
        startDate: Date,
        endDate: Date,
        current: Boolean,
        description: String,
      },
    ],
    location: {
      city: String,
      country: String,
    },
    relationship: {
      type: String,
      enum: ["Single", "In a relationship", "Engaged", "Married", "Complicated", "Separated", "Divorced", "Widowed", ""],
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Bio = mongoose.model("Bio", bioSchema);
module.exports = Bio;
