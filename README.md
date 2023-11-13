run the following commands in a terminal on the root to see it throwing the following error
"ReferenceError: __dirname is not defined in ES module scope","    at ../../../../node_modules/sharp/lib/libvips.js (file:///var/task/images_handlers.mjs:783933:32)"

## Prerequisites

- `aws-sam-cli` - Install via the AWS method: [here](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html). We use the CLI tool to build, run, and invoke lambda functions. AWS no longer supportis installation through the AWS-managed Homebrew installer and recommends installation through first-party installers. Relevant thread: [here](https://github.com/aws/aws-sam-cli/issues/5613).
- `esbuild` - Install with `npm install -g esbuild`. AWS SAM CLI uses `esbuild` to transpile Typescript code into Javascript.
- `curl` or `aws-cli` - Used to invoke lambda functions. `curl` should already be installed but if not then install via method of your choice. `aws-cli` should be installed via the AWS method: [here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

## To run on local

1. `yarn`
2. `export NODE_OPTIONS=--max_old_space_size=8192`
2. `sam build && sam local start-lambda`
3. Open a new terminal
4. Execute the following 
```
curl -XPOST "http://localhost:3001/2015-03-31/functions/DummyPrintMethod/invocations" -d '{"Records": [{ "cf": { "request":{
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
```
