import 'dotenv/config';
import app from './app.js';
import connectDatabase from './config/db.js';
const port = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
await connectDatabase();
app.listen(port, () => console.log(`Farmer marketplace API listening on port ${port}`));
