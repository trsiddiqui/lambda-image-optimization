import {
  APIGatewayEvent,
  APIGatewayProxyResult,
  CloudFrontResponseEvent,
  Callback,
  CloudFrontResultResponse,
} from 'aws-lambda'
import AWS from 'aws-sdk'
import Sharp from 'sharp'

// These handler methods are for testing the creation and invocation of lambda functions

// use the following to test the method as this is the response received by the function in the origin response of cloudfront
/**
 * curl -XPOST "http://localhost:3001/2015-03-31/functions/DummyPrintMethod/invocations" -d '{"Records": [{ "cf": { "request":{
      "clientIp":"50.71.185.43",
      "headers":{
         "x-forwarded-for":[
            {
              "key":"X-Forwarded-For",
              "value":"50.71.185.43"
            }
         ],
         "user-agent":[
            {
              "key":"User-Agent",
              "value":"Amazon CloudFront"
            }
         ],
         "via":[
            {
              "key":"Via",
              "value":"2.0 9f55fd8c516617ac4554ca1d243d55b8.cloudfront.net (CloudFront)"
            }
         ],
         "accept-encoding":[
            {
              "key":"Accept-Encoding",
              "value":"br,gzip"
            }
         ],
         "host":[
            {
              "key":"Host",
              "value":"taha-test-bucket-images.s3.us-east-1.amazonaws.com"
            }
         ]
      },
      "method":"GET",
      "origin":{
         "s3":{
            "authMethod":"none",
            "customHeaders":{
            },
            "domainName":"taha-test-bucket-images.s3.us-east-1.amazonaws.com",
            "path":""
         }
      },
      "querystring":"",
      "uri":"/img.jpeg?height=800&width=1054"
  }, "response":{ 
      "headers":{
         "x-amz-request-id":[
            {
              "key":"x-amz-request-id",
              "value":"8KZZJGFVVQ84HPRZ"
            }
         ],
         "x-amz-id-2":[
            {
              "key":"x-amz-id-2",
              "value":"lnKXkzd1E4vl8tC2NU4RVtaNIWa/6WqgDp5bRktT+3in2huqO+2OSQ7MK91NesVYUzpLhcpwrd8="
            }
         ],
         "date":[
            {
              "key":"Date",
              "value":"Wed, 09 Aug 2023 04:37:01 GMT"
            }
         ],
         "server":[
            {
              "key":"Server",
              "value":"AmazonS3"
            }
         ],
         "content-type":[
            {
              "key":"Content-Type",
              "value":"application/xml"
            }
         ],
         "transfer-encoding":[
            {
              "key":"Transfer-Encoding",
              "value":"chunked"
            }
         ]
      },
      "status":"403",
      "statusDescription":"Forbidden"
  }}}]}'
 */

export const dummyPrintMethod = async (
  event: CloudFrontResponseEvent,
  _context: unknown,
  callback: Callback,
): Promise<CloudFrontResultResponse> => {
  // This is the cloudfront origin response which can only be an error
  //  because if the original cloudfront request had succeeded then
  //  the cloudfront would have responded to the consumer on its own
  //  and the lambda function wouldn't have been called
  const response = event.Records[0].cf.response
  const request = event.Records[0].cf.request

  // the repo is public
  const s3Config = {
    accessKeyId: 'asdasd',
    secretAccessKey: 'asdasd+8qBvXN6Dr',
    region: 'us-east-1',
  }

  AWS.config.update({ region: 'us-east-1' })

  // Use AWS credentials (IAM Role) tied to the EC2 instance for production
  const s3Instance = new AWS.S3(s3Config)
  /*
   * This function updates the HTTP status code in the response to 302, to redirect to another
   * path (cache behavior) that has a different origin configured. Note the following:
   * 1. The function is triggered in an origin response
   * 2. The response status from the origin server is an error status code (4xx or 5xx)
   */
  // the repo is public so covering all error codes
  if (parseInt(response.status) >= 400 && parseInt(response.status) <= 599) {
    const imageKey = request.uri.replace('/', '')

    const parametersMap = request.querystring
      .split('&')
      .reduce(
        (map, queryParam) => ((map[queryParam.split('=')[0]] = queryParam.split('=')[1]), map),
        {} as { [x: string]: string },
      )

    let originalImage, contentType
    try {
      originalImage = await s3Instance
        .getObject({ Bucket: 'taha-test-bucket-original-images', Key: imageKey })
        .promise()
      contentType = originalImage.ContentType
    } catch (error) {
      return { status: '500', body: 'error downloading original image' }
    }

    const width = parametersMap?.width ? parseInt(parametersMap?.width) : 1400
    const height = parametersMap?.height ? parseInt(parametersMap?.height) : 787
    const format = parametersMap?.format

    let transformedImage = Sharp(originalImage.Body as Buffer, { failOn: 'none', animated: true })
    // Get image orientation to rotate if needed
    // const imageMetadata = await transformedImage.metadata();

    try {
      transformedImage = transformedImage.resize({ height, width })
      let formatEnum = Sharp.format.jpeg
      if (format) {
        switch (format) {
          case 'jpeg':
            contentType = 'image/jpeg'
            formatEnum = Sharp.format.jpeg
            break
          case 'png':
            contentType = 'image/png'
            formatEnum = Sharp.format.png
            break
          default:
            contentType = 'image/jpeg'
            formatEnum = Sharp.format.jpeg
        }
        transformedImage = transformedImage.toFormat(formatEnum, {
          quality: 80,
        })
      }
    } catch (error) {
      return { status: '500', body: 'error transforming image' }
    }

    const transformedImageBuffer = await transformedImage.toBuffer()

    try {
      await s3Instance
        .putObject({
          Body: transformedImageBuffer,
          Bucket: 'taha-test-bucket-images',
          Key: `${imageKey}?${request.querystring}`,
          ContentType: contentType,
          Metadata: {
            'cache-control': 'max-age=31622400',
          },
        })
        .promise()
    } catch {
      return { status: '500', body: 'error transforming image' }
    }

    return {
      status: '200',
      body: transformedImageBuffer.toString('base64'),
      bodyEncoding: 'base64',
      headers: {
        'Content-Type': [{ 
          key: 'Content-Type',
          value: contentType ?? '' 
        }],
        'Cache-Control': [{ 
          key: 'Cache-Control',
          value: 'max-age=31622400' 
        }],
      },
    }
    // let transformedImage = Sharp(originalImage.Body as Buffer, { failOn: 'none', animated: true })
    //   .resize({
    //     width,
    //     height,
    //     fit: Sharp.fit.cover,
    //     position: Sharp.strategy.entropy,
    //   })
    //   .jpeg({ quality: 80 })

    //   const imageMetadata = await transformedImage.metadata();
    /**
     * FETCH S3 IMAGE FROM THE MENU ITEM IMAGES BUCKET
     * PROCESS/TRANSFORM USING SHARP LIBRARY AS PER THE REQUIREMENTS
     *      USE DEFAULTS FOR TYPE AND SIZE IF NOT PROVIDED
     *      400X(whatever y as per ratio) and jpeg should be good enough defaults
     * PUT IN THE OPTIMIZED IMAGES S3 Bucket
     * REDIRECT WITH A 302 (as below, to the recently PUT image)
     */
    // const redirect_path = `/redirected.jpg`
    // response.status = '302'
    // response.statusDescription = 'Found'
    // /* Drop the body, as it is not required for redirects */
    // // response.body = '';
    // response.headers['location'] = [{ key: 'Location', value: redirect_path }]
  }
  // response.body = JSON.stringify({ request, response, event })
  callback(null, response)

  // practically it should never reach here in production
  return {
    status: '200',
  }
}

export const anotherDummyPrintMethod = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  const body = {
    message: 'a body was not sent in the request',
  }

  if (event.body) {
    body.message = `Incoming request body: ${event.body}`
  }

  return {
    statusCode: 200,
    body: JSON.stringify(body),
  }
}
