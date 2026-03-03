import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    language: { type: String, default: "javascript" },
    savedAt: { type: Date, default: Date.now },
    savedBy: { type: String, default: "system" }
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    constraints: [String],
    examples: [String]
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    code: { type: String, default: "// Start coding collaboratively..." },
    language: { type: String, default: "javascript" },
    participants: [{ type: String }],
    versions: [versionSchema],
    activeProblem: problemSchema,
    operationsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", sessionSchema);
