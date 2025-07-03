const mongoose = require('mongoose');
const dotenv = require('dotenv');
const expireReservationJob = require('./utils/expireReservationJob');
const app = require('./app');

dotenv.config();

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
    }
  })
  .catch(err => console.log(err));

module.exports = app;

"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NjJjNjlmNGJlMDhhOTNjZjgwMGIzNSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUxNTI0MjMxfQ.7YNqzkNEQZYOg25UevXI46eTxlJswK6JKXN0muZCvw0"