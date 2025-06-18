import AppError from "./appError";

// utils/filter.js
const validCategories = ['TECHNOLOGY',
    'LIFESTYLE',
    'TRAVEL',
    'FOOD',
    'HEALTH',
    'FINANCE',
    'EDUCATION',
    'ENTERTAINMENT'];

const getCategoryFilter = (queryCategory: string, next: (arg0: AppError) => any) => {
  if (!queryCategory) return {};

  const normalized =
    queryCategory.toUpperCase();

  if (!validCategories.includes(normalized)) {
    return next(new AppError("Invalid category", 400));
  }

  return normalized ;
};

export {
    getCategoryFilter
}