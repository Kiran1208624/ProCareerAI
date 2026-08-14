import mongoose, {
  Schema,
  HydratedDocument,
} from "mongoose";

export interface IApplication {
  studentId: mongoose.Types.ObjectId;

  collegeId?: mongoose.Types.ObjectId;

  companyId: mongoose.Types.ObjectId;

  placementDriveId?: mongoose.Types.ObjectId;

  jobId: mongoose.Types.ObjectId;

  resumeId?: mongoose.Types.ObjectId;

  coverLetter?: string;

  status:
    | "Applied"
    | "Screening"
    | "Shortlisted"
    | "Interview"
    | "Offer"
    | "Hired"
    | "Rejected"
    | "Withdrawn";

  matchScore: number;

  notes?: string;

  appliedAt: Date;

  isDeleted: boolean;
}

const applicationSchema = new Schema<IApplication>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    collegeId: {
      type: Schema.Types.ObjectId,
      ref: "College",
      default: null,
      index: true,
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    placementDriveId: {
      type: Schema.Types.ObjectId,
      ref: "PlacementDrive",
    },

    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    resumeId: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
    },

    coverLetter: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Screening",
        "Shortlisted",
        "Interview",
        "Offer",
        "Hired",
        "Rejected",
        "Withdrawn",
      ],
      default: "Applied",
    },

    matchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    notes: {
      type: String,
      default: "",
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index(
  {
    studentId: 1,
    jobId: 1,
  },
  {
    unique: true,
  }
);

export type ApplicationDocument =
  HydratedDocument<IApplication>;

export default mongoose.model<IApplication>(
  "Application",
  applicationSchema
);