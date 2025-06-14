const User = require('../models/User');

const roles = {
  admin: ['admin'],
  manager: ['admin', 'manager'],
  employee: ['admin', 'manager', 'employee']
};

const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.' 
        });
      }

      req.userRole = user.role;
      next();
    } catch (err) {
      console.error('Role check error:', err);
      res.status(500).json({ message: 'Server error during role verification' });
    }
  };
};

module.exports = {
  roles,
  checkRole,
  isAdmin: checkRole(roles.admin),
  isManager: checkRole(roles.manager),
  isEmployee: checkRole(roles.employee)
}; 