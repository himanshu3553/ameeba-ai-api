import mongoose, { Schema, Document } from 'mongoose';

export interface IPrompt extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromptSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Prompt name is required'],
      trim: true,
      minlength: [1, 'Prompt name must be at least 1 character'],
      maxlength: [200, 'Prompt name must not exceed 200 characters'],
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
PromptSchema.index({ userId: 1, projectId: 1, isActive: 1 });
PromptSchema.index({ userId: 1, isActive: 1 });
PromptSchema.index({ userId: 1 });
PromptSchema.index({ projectId: 1, isActive: 1 });
PromptSchema.index({ isActive: 1 });

export default mongoose.model<IPrompt>('Prompt', PromptSchema);

