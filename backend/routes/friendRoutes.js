const express = require("express");
const {
  getFriendSuggestions,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} = require("../controllers/friendController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.get("/suggestions", protect, getFriendSuggestions);
router.get("/requests", protect, getFriendRequests);
router.post("/request/:id", protect, sendFriendRequest);
router.put("/accept/:id", protect, acceptFriendRequest);
router.put("/decline/:id", protect, declineFriendRequest);
router.delete("/:id", protect, removeFriend);

module.exports = router;
