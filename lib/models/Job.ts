import { Schema, model, Types } from "mongoose";

export type JobStatus =
  | "draft"
  | "published"
  | "closed";

const jobSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    employmentType: {
      type: String,
      enum: [
        "full_time",
        "part_time",
        "internship",
        "contract",
      ],
      required: true,
    },

    experience: {
      type: String,
      required: true,
    },

    salaryMin: {
      type: Number,
      default: 0,
    },

    salaryMax: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
      required: true,
    },

    skills: [
      {
        type: String,
      },
    ],

    eligibility: {
      type: String,
      default: "",
    },

    applicationDeadline: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },

    companyId: {
      type: Types.ObjectId,
      ref: "Company",
      required: true,
    },

    createdBy: {
      type: Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Job", jobSchema);