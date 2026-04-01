const { User } = require('../models');
const { generateToken } = require('../middleware/auth');

const authController = {
  // Register
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      const user = await User.create({ name, email, password });
      
      const token = generateToken(user.id);
      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          status: user.status
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      user.status = 'online';
      await user.save();
      
      const token = generateToken(user.id);
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          status: user.status
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      const user = await User.findByPk(req.userId);
      if (user) {
        user.status = 'offline';
        await user.save();
      }
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get current user
  getMe: async (req, res) => {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: { exclude: ['password'] }
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = authController;
