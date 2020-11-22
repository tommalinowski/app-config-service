const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  client: {
    type: String,
    required: [true, 'A config must have a client provided'],
    trim: true,
  },
  version: {
    type: Number,
    required: [true, 'A config must have a version provided'],
  },
  clientConfigs: {
    type: Map,
    of: String,
    required: [true, 'A config must have client configs set'],
    trim: true,
  },
});

configSchema.index({ client: 1, version: 1 }, { unique: true });

const Config = mongoose.model('Config', configSchema);

module.exports = Config;
