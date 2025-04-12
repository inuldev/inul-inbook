const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    caption: {
      type: String,
      default: "",
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Stories expire after 24 hours
        const date = new Date();
        date.setHours(date.getHours() + 24);
        return date;
      },
    },
  },
  { timestamps: true }
);

// Index for finding and removing expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model("Story", storySchema);
module.exports = Story;
