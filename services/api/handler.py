import { Handler, Context } from 'aws-lambda';

export const handler: Handler = async (event: any, context: Context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'OpenVision API',
      version: '1.0.0'
    })
  };
};
