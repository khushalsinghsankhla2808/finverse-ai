import app from './src/app';
import env from './src/config/env';
import connectDB from './src/config/db';

const startServer = async () => {
  try {
    // Establish Database connection
    await connectDB();

    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 FinVerse Server Booted on Port ${PORT} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error('❌ Server startup failure:', error);
    process.exit(1);
  }
};

startServer();
