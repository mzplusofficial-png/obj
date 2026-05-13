import serverless from 'serverless-http';
import { createServer } from '../../server.js';

let appPromise: Promise<any> | null = null;

const handler = async (event: any, context: any) => {
  // Lazy initialize the express app
  if (!appPromise) {
    appPromise = createServer();
  }
  
  const app = await appPromise;
  const serverlessHandler = serverless(app);
  
  return await serverlessHandler(event, context);
};

export { handler };
