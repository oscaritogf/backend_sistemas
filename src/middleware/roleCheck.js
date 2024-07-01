exports.checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    const userRoles = req.user.roles;
    const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasAllowedRole) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    next();
  };
};