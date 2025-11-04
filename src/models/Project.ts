import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [1, 'Project name must be at least 1 character'],
      maxlength: [200, 'Project name must not exceed 200 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
ProjectSchema.index({ isActive: 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);

