const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: [function() { return !this.googleId; }, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['user', 'superadmin'],
    default: 'user'
  },
  profileImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
AdminSchema.pre('save', function() {
  if (!this.password || !this.isModified('password')) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) return reject(err);
      bcrypt.hash(this.password, salt, (err, hash) => {
        if (err) return reject(err);
        this.password = hash;
        resolve();
      });
    });
  });
});

// Method to check if password is correct
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);
