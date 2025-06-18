const getPagination = (reqQuery: { page: string; limit: string }) => {
  const page = parseInt(reqQuery.page, 10) || 1;
  const limit = parseInt(reqQuery.limit, 10) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export default getPagination;
