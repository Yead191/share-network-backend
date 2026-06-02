import { StatusCodes } from "http-status-codes";
import ApiError from "../errors/ApiError";

export const validateInternshipPayload = (payload: any) => {
    const errors: Array<{ path: string; message: string }> = [];

    // overallScore validation
    if (payload.overallScore == null) {
        errors.push({ path: "overallScore", message: "Path overallScore is required." });
    } else if (payload.overallScore < 1 || payload.overallScore > 10) {
        errors.push({ path: "overallScore", message: "Overall score must be between 1 and 10." });
    }

    // performanceRating validation
    if (payload.performanceRating == null) {
        errors.push({ path: "performanceRating", message: "Path performanceRating is required." });
    } else if (payload.performanceRating < 1 || payload.performanceRating > 5) {
        errors.push({ path: "performanceRating", message: "Performance rating must be between 1 and 5." });
    }

    if (errors.length > 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Validation Error", {
            errorMessages: errors,
        } as any);
    }
};