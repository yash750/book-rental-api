const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    try {
      const role = req.body.role === 'admin' ? 'admin' : 'user'; // whitelist
      const user = new User({ ...req.body, role });
      user.borrowedBooksCount = 0;
      user.outstandingFine = 0;
      await user.save();
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
      res.status(201).json({ token });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  

exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token });
};

exports.getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
  
