import { StatusCodes } from "http-status-codes";
import ApiError from "../../../../errors/ApiError";
import QueryBuilder from "../../../../shared/apiFeature";
import { IGoal } from "./goal.interface";
import { Goal } from "./goal.model";
import mongoose from "mongoose";
import { User } from "../../user/user.model";


const createGoalFromDb = async (studentId: string, payload: IGoal[]) => {
  const goalsArray = Array.isArray(payload) ? payload : [payload];

  const isUserExist = await User.findById(studentId).populate("Goals");
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
  }

  const existingGoals = isUserExist.Goals || [];
  let result;
  let message;

  if (existingGoals.length >= 3) {
    // Update existing goals
    const updateResults = [];

    for (let i = 0; i < 3; i++) {
      const goalId = (existingGoals[i] as any)._id;
      const goalData = goalsArray[i];

      if (goalData) {
        const updatedGoal = await Goal.findByIdAndUpdate(
          goalId,
          { ...goalData },
          { new: true, runValidators: true }
        );
        updateResults.push(updatedGoal);
      }
    }

    result = updateResults;
    message = "Goals updated successfully";

  } else {
    // Create new goals
    const newGoals = await Goal.insertMany(goalsArray);
    const goalIds = newGoals.map(goal => goal._id);

    await User.findByIdAndUpdate(
      studentId,
      { $addToSet: { Goals: { $each: goalIds } } },
      { new: true }
    );

    result = newGoals;
    message = "Goals created successfully";
  }

  return { message, result };
};

const getAllGoalsFromDB = async (query: Record<string, any>) => {
  const result = new QueryBuilder(Goal.find(), query).search(['title', 'description']).filter().sort().paginate();
  const goals = await result.queryModel;
  const pagination = await result.getPaginationInfo();
  return { goals, pagination };
}

const getGoalByIdFromDB = async (id: string) => {
  const result = await Goal.findById(id);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Goal doesn't exist!");
  }
  return result;
}

const updateGoalInDB = async (id: string, payload: Partial<IGoal>) => {
  // console.log("Type of payload:", Array.isArray(payload) ? "ARRAY" : typeof payload);
  // console.log("Payload value:", payload);

  if (payload.index) {
    const isGoalExist = await Goal.exists({ index: payload.index, _id: { $ne: id } });
    if (isGoalExist) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Goal with this index already exists!");
    }
  }

  const updateData = Array.isArray(payload) ? payload[0] : payload;

  if (!updateData || Object.keys(updateData).length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No valid update data provided");
  }

  const result = await Goal.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Goal doesn't exist!");
  }

  return { message: "Goal updated successfully", result };
}

const deleteGoalFromDB = async (id: string) => {
  const result = await Goal.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Goal doesn't exist!");
  }
  const message = "Goal deleted successfully";
  return { message };
}

export const goalService = {
  createGoalFromDb,
  getAllGoalsFromDB,
  getGoalByIdFromDB,
  updateGoalInDB,
  deleteGoalFromDB
}