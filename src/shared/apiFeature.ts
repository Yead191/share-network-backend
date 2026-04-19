import { FilterQuery } from "mongoose";

export interface GetAllEventsQuery {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sort?: string;
  [key: string]: any;
}

class QueryBuilder {
  [x: string]: any;
  queryModel: any;
  query: any;

  constructor(queryModel: any, query: Record<string, any> = {}) {
    this.queryModel = queryModel;
    this.query = query;
  }

  // searching
search(searchableFields: string[]) {
  if (this.query?.searchTerm) {
    const searchQuery = {
      $or: searchableFields.map((field) => ({
        [field]: { $regex: this.query.searchTerm, $options: "i" },
      })),
    };
    const existingQuery = this.queryModel.getQuery();
    this.queryModel = this.queryModel.find({ $and: [existingQuery, searchQuery] });
  }
  return this;
}

  // filtering
  // filter() {
  //   const queryCopy = { ...this.query };
  //   const removeFields = ["searchTerm", "page", "limit", "sort"];
  //   removeFields.forEach((field) => delete queryCopy[field]);
  //   let queryStr = JSON.stringify(queryCopy);
  //   queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);
  //   this.queryModel = this.queryModel.find(JSON.parse(queryStr));
  //   return this;
  // }
  filter(ignoredFields: string[] = []) {
  const queryCopy = { ...this.query };
  
  // Add userGroup and userGroupTrack here so filter() ignores them
  const removeFields = ["searchTerm", "page", "limit", "sort", "userGroup", "userGroupTrack", ...ignoredFields];
  removeFields.forEach((field) => delete queryCopy[field]);
  
  let queryStr = JSON.stringify(queryCopy);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);
  this.queryModel = this.queryModel.find(JSON.parse(queryStr));
  console.log("queryStr", queryStr);
  return this;
}

  // sorting
  sort() {
    const sortBy = this.query.sort || "-createdAt";
    this.queryModel = this.queryModel.sort(sortBy);
    return this;
  }

paginate() {
  const page = Math.max(Number(this.query.page) || 1, 1);
  const limit = Number(this.query.limit);

  if (this.query.limit !== undefined && limit === 0) {
    return this;
  }

  const finalLimit = limit || 10;
  const skip = (page - 1) * finalLimit;

  this.queryModel = this.queryModel.skip(skip).limit(finalLimit);
  return this;
}

async getPaginationInfo() {
  const page = Math.max(Number(this.query.page) || 1, 1);
  const limit = Number(this.query.limit);

  const total = await this.queryModel.model.countDocuments(
    this.queryModel.getQuery()
  );

  let totalPage = 1;
  let currentLimit = total;

  if (this.query.limit !== undefined && limit === 0) {
    totalPage = 1;
    currentLimit = total;
  } else {
    currentLimit = limit || 10;
    totalPage = Math.ceil(total / currentLimit);
  }

  return {
    total,
    totalPage,
    page,
    limit: currentLimit,
  };
}
}

export default QueryBuilder;