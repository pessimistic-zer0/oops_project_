import 'dotenv/config';
import app from './app.js';
import { connectDB } from './utils/db.js';

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 8000; 

(async () => {
  try {
    await connectDB(MONGO_URI);
    app.listen(PORT, () => {
      console.log(`HTTP server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
})();