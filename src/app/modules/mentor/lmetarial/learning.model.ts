import { Schema, model } from "mongoose";
import { ILearningMaterial } from "./learning.interface";
import { ResourceType } from '../../../../enums/serviceType';
import { USER_ROLES } from "../../../../enums/user";


const learningMaterialSchema = new Schema<ILearningMaterial>({
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    
    title: { type: String, required: true },
    description: { type: String, required: false },
    dueDate: { type: Date, required: false},
    type: {
    type: String,
    enum: Object.values(ResourceType),
    required: false,
    },
    
    contentUrl: { type: String, required: false },
    pdf: { type: String, required: false },
    targertGroup: { type: Schema.Types.ObjectId, ref: 'UserGroup', required: false },
    targeteAudience: {
            type: String,
            enum: Object.values(USER_ROLES),
            default: USER_ROLES.STUDENT,
            required: true
        },
    
    markAsAssigned: { type: Boolean, required: false },
    
}, { timestamps: true });

export const LearningMaterial = model<ILearningMaterial>('LearningMaterial', learningMaterialSchema);