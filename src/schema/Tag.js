const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Tag = mongoose.model('Tag', TagSchema);

module.exports = Tag;
