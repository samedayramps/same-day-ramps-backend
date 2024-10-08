// src/server.ts
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables

import mongoose from 'mongoose';
import app from './app';

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ty:ReGGie.02@samedayramps-db.ulmux.mongodb.net/?retryWrites=true&w=majority&appName=samedayramps-db';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });