const { login: loginMiddleware } = require('../middleware/auth');

const login = async (req, res) => {
  try {
    await loginMiddleware(req, res);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

module.exports = { login };
