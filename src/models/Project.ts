import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
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

// Indexes for better query performance
ProjectSchema.index({ userId: 1, isActive: 1 });
ProjectSchema.index({ userId: 1 });
ProjectSchema.index({ isActive: 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);

