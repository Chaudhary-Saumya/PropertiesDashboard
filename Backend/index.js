require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
  process.exit(1);
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Import Models
const Admin = require('./models/Admin');
const Property = require('./models/Property');

// Import Auth Middleware
const auth = require('./middleware/auth');

const app = express();

// Security Middlewares

// Configure restricted CORS in production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (like mobile apps, postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Request blocked by CORS security policy'));
    }
  },
  credentials: true
}));

// Helmet-equivalent security headers for Express
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:5000 https://api.cloudinary.com; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure public/uploads directory exists for local image fallback
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads folder statically
app.use('/uploads', express.static(uploadsDir));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer In-Memory Storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/properties_db';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// --- AUTHENTICATION ROUTES ---

// @route   POST api/auth/register
// @desc    Register an admin
// @access  Public
app.post('/api/auth/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    let query = [{ username: username.trim() }];
    if (email && email.trim()) {
      query.push({ email: email.trim() });
    }

    let admin = await Admin.findOne({ $or: query });
    if (admin) {
      return res.status(400).json({ message: 'User already exists with this username or email' });
    }

    admin = new Admin({ 
      username: username.trim(), 
      password, 
      email: email && email.trim() ? email.trim() : undefined 
    });
    await admin.save();

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, admin: { id: admin._id, username: admin.username, email: admin.email || 'N/A', role: admin.role, profileImage: admin.profileImage || '' } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate admin & get token
// @access  Public
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const admin = await Admin.findOne({ email: email.trim() });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, admin: { id: admin._id, username: admin.username, email: admin.email || 'N/A', role: admin.role, profileImage: admin.profileImage || '' } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST api/auth/google
// @desc    Authenticate or Register with Google
// @access  Public
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  
  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // Find or create admin user matching googleId or email
    let admin = await Admin.findOne({ $or: [{ googleId }, { email }] });

    if (!admin) {
      // Create a username from email prefix or name
      let baseUsername = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : email.split('@')[0];
      if (baseUsername.length < 3) baseUsername = 'user_' + baseUsername;
      
      let username = baseUsername;
      let counter = 1;
      while (await Admin.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      admin = new Admin({
        username,
        email,
        googleId,
        // password is not required for Google users
      });
      await admin.save();
    } else {
      // Update Google ID and Email if not set
      let needsUpdate = false;
      if (!admin.googleId) {
        admin.googleId = googleId;
        needsUpdate = true;
      }
      if (!admin.email) {
        admin.email = email;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await admin.save();
      }
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role, profileImage: admin.profileImage || '' } });
  } catch (err) {
    console.error('Google auth verification error:', err);
    res.status(400).json({ message: 'Google authentication failed or expired token' });
  }
});

// @route   GET api/auth/me
// @desc    Get current admin profile
// @access  Private
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/auth/profile
// @desc    Update admin/user profile (username & profileImage)
// @access  Private
app.put('/api/auth/profile', auth, async (req, res) => {
  const { username, profileImage } = req.body;
  
  try {
    const adminUser = await Admin.findById(req.admin.id);
    if (!adminUser) return res.status(404).json({ message: 'User not found' });

    if (username && username.trim() !== adminUser.username) {
      const trimmedUsername = username.trim();
      
      if (trimmedUsername.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters long' });
      }

      // Check if username already exists
      const existing = await Admin.findOne({ username: trimmedUsername });
      if (existing && existing._id.toString() !== req.admin.id) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      adminUser.username = trimmedUsername;
    }

    if (profileImage !== undefined) {
      adminUser.profileImage = profileImage;
    }

    await adminUser.save();

    res.json({ 
      id: adminUser._id, 
      username: adminUser.username, 
      email: adminUser.email || 'N/A',
      role: adminUser.role,
      profileImage: adminUser.profileImage || ''
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(550).json({ message: 'Server error updating profile' });
  }
});

// @route   GET api/auth/users
// @desc    Get all users and their property listings (superadmin only)
// @access  Private
app.get('/api/auth/users', auth, async (req, res) => {
  try {
    const caller = await Admin.findById(req.admin.id);
    if (!caller || (caller.role !== 'superadmin' && caller.username !== 'admin')) {
      return res.status(403).json({ message: 'Forbidden: Only the system administrator can view users' });
    }

    const users = await Admin.find().select('-password').sort({ createdAt: -1 });
    
    // For each user, fetch their properties
    const usersWithProperties = await Promise.all(users.map(async (user) => {
      const userProperties = await Property.find({ createdBy: user._id }).sort({ createdAt: -1 });
      return {
        _id: user._id,
        username: user.username,
        email: user.email || 'N/A',
        googleId: user.googleId ? 'Yes' : 'No',
        role: user.role,
        createdAt: user.createdAt,
        properties: userProperties
      };
    }));

    res.json(usersWithProperties);
  } catch (err) {
    console.error('Error fetching users directory:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/auth/users/:id
// @desc    Delete a user account and their properties (superadmin only)
// @access  Private
app.delete('/api/auth/users/:id', auth, async (req, res) => {
  try {
    const caller = await Admin.findById(req.admin.id);
    if (!caller || (caller.role !== 'superadmin' && caller.username !== 'admin')) {
      return res.status(403).json({ message: 'Forbidden: Only the system administrator can delete users' });
    }

    const userIdToDelete = req.params.id;
    
    // Prevent admin from deleting themselves
    if (userIdToDelete === req.admin.id) {
      return res.status(400).json({ message: 'You cannot delete your own superadmin account' });
    }

    const user = await Admin.findById(userIdToDelete);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all properties created by this user
    await Property.deleteMany({ createdBy: userIdToDelete });

    // Delete the user account
    await Admin.findByIdAndDelete(userIdToDelete);

    res.json({ message: `User account '${user.username}' and their listings were deleted successfully.` });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});


// --- PROPERTY CRUD ROUTES ---

// @route   GET api/properties
// @desc    Get all properties (admin only)
// @access  Private
app.get('/api/properties', auth, async (req, res) => {
  try {
    const caller = await Admin.findById(req.admin.id);
    const isSuperAdmin = caller && (caller.role === 'superadmin' || caller.username === 'admin');

    let query = {};
    if (!isSuperAdmin) {
      query = { createdBy: req.admin.id };
    }

    const properties = await Property.find(query).populate('createdBy', 'username').sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ message: 'Server error fetching properties' });
  }
});

// @route   GET api/properties/:id
// @desc    Get property by ID
// @access  Private
app.get('/api/properties/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('createdBy', 'username');
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const caller = await Admin.findById(req.admin.id);
    const isSuperAdmin = caller && (caller.role === 'superadmin' || caller.username === 'admin');

    // Only allow owner or admin to fetch full details
    if (!isSuperAdmin && property.createdBy._id.toString() !== req.admin.id) {
      return res.status(403).json({ message: 'Not authorized to view this property' });
    }

    res.json(property);
  } catch (err) {
    console.error('Error fetching property details:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/properties
// @desc    Create a new property
// @access  Private
app.post('/api/properties', auth, async (req, res) => {
  const {
    title,
    type,
    location,
    ownerName,
    ownerContact,
    flatNumber,
    sqryard,
    purpose,
    price,
    images,
    additionalInfo
  } = req.body;

  try {
    const newProperty = new Property({
      title,
      type,
      location,
      ownerName,
      ownerContact,
      flatNumber,
      sqryard,
      purpose,
      price,
      images,
      additionalInfo,
      createdBy: req.admin.id
    });

    const property = await newProperty.save();
    res.status(201).json(property);
  } catch (err) {
    console.error('Error creating property:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error creating property' });
  }
});

// @route   PUT api/properties/:id
// @desc    Update an existing property
// @access  Private
app.put('/api/properties/:id', auth, async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const caller = await Admin.findById(req.admin.id);
    const isSuperAdmin = caller && (caller.role === 'superadmin' || caller.username === 'admin');

    if (!isSuperAdmin && property.createdBy.toString() !== req.admin.id) {
      return res.status(403).json({ message: 'Not authorized to modify this property' });
    }

    // Update fields
    const updatedData = { ...req.body };
    
    // Perform update
    property = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    res.json(property);
  } catch (err) {
    console.error('Error updating property:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error updating property' });
  }
});

// @route   DELETE api/properties/:id
// @desc    Delete a property
// @access  Private
app.delete('/api/properties/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const caller = await Admin.findById(req.admin.id);
    const isSuperAdmin = caller && (caller.role === 'superadmin' || caller.username === 'admin');

    if (!isSuperAdmin && property.createdBy.toString() !== req.admin.id) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property removed successfully' });
  } catch (err) {
    console.error('Error deleting property:', err);
    res.status(500).json({ message: 'Server error deleting property' });
  }
});

// Helper to save files locally on SSL/Network error
async function saveFileLocally(file, req) {
  const extension = path.extname(file.originalname) || '.png';
  const filename = `local-${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
  const filePath = path.join(uploadsDir, filename);
  
  await fs.promises.writeFile(filePath, file.buffer);
  
  const host = req.get('host') || 'localhost:5000';
  const protocol = req.protocol || 'http';
  return `${protocol}://${host}/uploads/${filename}`;
}

// @route   POST api/upload
// @desc    Upload images to Cloudinary (falls back to local filesystem if network/VPN blocks SSL handshake)
// @access  Private
app.post('/api/upload', auth, (req, res) => {
  upload.array('images', 10)(req, res, async function(err) {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(500).json({ message: err.message || 'Error parsing files' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    try {
      // Upload each buffer to Cloudinary (with fallback to local folder on connection timeout/reset)
      const uploadPromises = req.files.map(file => {
        return new Promise(async (resolve) => {
          try {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'properties_dashboard',
                resource_type: 'image',
                public_id: `image-${Date.now()}-${Math.round(Math.random() * 1E9)}`
              },
              async (error, result) => {
                if (error) {
                  console.warn('Cloudinary upload failed, falling back to local file storage:', error.message || error);
                  const localUrl = await saveFileLocally(file, req);
                  return resolve(localUrl);
                }
                resolve(result.secure_url);
              }
            );
            uploadStream.end(file.buffer);
          } catch (cloudinaryError) {
            console.warn('Cloudinary upload failed during execution, falling back to local file storage:', cloudinaryError);
            const localUrl = await saveFileLocally(file, req);
            resolve(localUrl);
          }
        });
      });

      const urls = await Promise.all(uploadPromises);
      res.json({ urls });
    } catch (uploadError) {
      console.error('Upload processing error:', uploadError);
      res.status(500).json({ message: 'Error processing files upload' });
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
