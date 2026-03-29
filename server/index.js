import 'dotenv/config';
import app from './src/app.js';
import { PORT } from './src/config/env.js';

app.listen(PORT, () => {
  console.log(`RecruitFlow server running on port ${PORT}`);
});