import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptVersion extends Document {
  userId: mongoose.Types.ObjectId;
  promptId: mongoose.Types.ObjectId;
  promptText: string;
  version: string;
  versionName: string;
  activePrompt: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromptVersionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    promptId: {
      type: Schema.Types.ObjectId,
      ref: 'Prompt',
      required: [true, 'Prompt ID is required'],
    },
    promptText: {
      type: String,
      required: [true, 'Prompt text is required'],
      trim: true,
      minlength: [1, 'Prompt text must be at least 1 character'],
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    versionName: {
      type: String,
      required: true,
      trim: true,
    },
    activePrompt: {
      type: Boolean,
      default: false,
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

// Compound index to enforce unique activePrompt per prompt
// Only one document can have activePrompt=true per promptId
PromptVersionSchema.index(
  { promptId: 1, activePrompt: 1 },
  { unique: true, partialFilterExpression: { activePrompt: true } }
);

// Indexes for better query performance
PromptVersionSchema.index({ userId: 1, promptId: 1, isActive: 1 });
PromptVersionSchema.index({ userId: 1, isActive: 1 });
PromptVersionSchema.index({ userId: 1 });
PromptVersionSchema.index({ promptId: 1, isActive: 1 });
PromptVersionSchema.index({ isActive: 1 });

export default mongoose.model<IPromptVersion>('PromptVersion', PromptVersionSchema);

