import { Lambda } from '@aws-sdk/client-lambda'

export async function initAWSLambdaClientLocally(): Promise<Lambda> {
  // Only running in local env and CI
  return new Lambda({
    region: 'us-east-1',
    endpoint: 'http://localhost:3001',
    credentials: {
      accessKeyId: 'xxx',
      secretAccessKey: 'yyy',
      sessionToken: 'zzz',
    },
  })
}
