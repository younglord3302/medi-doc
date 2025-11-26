const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medi-doc', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
const patientRoutes = require('./routes/patients');
const recordRoutes = require('./routes/records');

app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Medi-Doc API server is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
