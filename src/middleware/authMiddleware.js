module.exports = function authMiddleware(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Attach auth context for controllers
  req.auth = req.session.user;

  next();
};
