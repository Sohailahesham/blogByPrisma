import {Request, Response, NextFunction} from 'express';
import AppError from '../utils/appError';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;


const asyncWrapper = (asyncFn: AsyncFunction) => {
  return (req:Request, res:Response, next:NextFunction) => {
    asyncFn(req, res, next).catch((err:AppError) => {
      console.log(err);
      next(err);
    });
  };
};

const functionWrapper = (fn: Function) => {
  return (req:Request, res:Response, next:NextFunction) => {
    try {
      fn(req, res, next);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
};

export {
  asyncWrapper,
  functionWrapper,
};
