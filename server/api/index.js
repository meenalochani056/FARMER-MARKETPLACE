import 'dotenv/config';
import app from '../app.js';
import connectDatabase from '../config/db.js';

export default async function handler(req, res) {
  await connectDatabase();
  return app(req, res);
}
