function paginate(model, include = []) {
  return async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = (page - 1) * limit;

      const { count, rows } = await model.findAndCountAll({
        limit,
        offset,
        include,
        order: [['created_at', 'DESC']],
        distinct: true,
      });

      const totalPages = Math.ceil(count / limit);
      res.json({
        data: rows,
        pagination: {
          total: count,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { paginate };
