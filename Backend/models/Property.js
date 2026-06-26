const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Property name/title is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Property type is required'],
    enum: {
      values: ['flat', 'commercial', 'bungalow'],
      message: '{VALUE} is not a valid property type'
    }
  },
  location: {
    type: String,
    required: [true, 'Property location/address is required'],
    trim: true
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },
  ownerContact: {
    type: String,
    required: [true, 'Owner contact number is required'],
    trim: true
  },
  flatNumber: {
    type: String,
    trim: true,
    default: ''
  },
  sqryard: {
    type: Number,
    required: [true, 'Square yard size is required'],
    min: [1, 'Square yards must be greater than 0']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose (lease or sell) is required'],
    enum: {
      values: ['lease', 'sell'],
      message: '{VALUE} is not a valid purpose'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number']
  },
  images: {
    type: [String],
    default: []
  },
  furnishing: {
    type: String,
    required: [true, 'Furnishing status is required'],
    enum: {
      values: ['furnished', 'semiFurnished', 'naked'],
      message: '{VALUE} is not a valid furnishing status'
    },
    default: 'naked'
  },
  additionalInfo: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Property', PropertySchema);
