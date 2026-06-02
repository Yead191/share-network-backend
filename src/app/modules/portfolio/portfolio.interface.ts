import { Model, Types } from 'mongoose';

export type IPortfolio = {
    image: string;
    PROVIDER: Types.ObjectId;
};
export type PortfolioModel = Model<IPortfolio>;