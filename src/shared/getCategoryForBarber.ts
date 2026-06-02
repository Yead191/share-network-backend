// import { StatusCodes } from "http-status-codes";
// import { Service } from "../app/modules/service/service.model";
// import ApiError from "../errors/ApiError";

// const getPROVIDERCategory = async (id: string)=>{
//     try {
//         const categories = await Service.find({PROVIDER: id}).populate("category", "name").select("category").lean();

//         const uniqueNames = Array.from(
//             new Set(categories.map((category: any) => category?.category?.name))
//         ).filter(Boolean);

//         return uniqueNames;
//     } catch (error) {
//         throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to get category");
//     }
// }

// export default getPROVIDERCategory;