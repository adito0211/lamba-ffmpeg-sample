import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda'
import * as notifications from '@aws-cdk/aws-s3-notifications';

export class LambaFfmpegSampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 動作検証用のS3を作成
    const videoBucket = new s3.Bucket(this, 'video-bucket');

    // FFmpegのLambdaレイヤーを作成
    const ffmegLayer = new lambda.LayerVersion(this, 'ffmpeg-layer', {
      layerVersionName: 'ffmpeg',
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_8],
      code: lambda.AssetCode.fromAsset('lambda_layer/ffmpeg')
    });

    // Lambda関数を作成
    const videoHandler = new lambda.Function(this, 'video-handler', {
      functionName: 'video-handler',
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'function.lambda_handler',
      code: lambda.AssetCode.fromAsset('lambda_function'),
      layers: [ffmegLayer],
      timeout: cdk.Duration.seconds(60),
    });

    // Lambda関数にS3の権限を付与
    videoBucket.grantReadWrite(videoHandler);
    
    // S3トリガーでLambdaを起動
    videoBucket.addObjectCreatedNotification(
      new notifications.LambdaDestination(videoHandler),
      { suffix: '.mp4' }
    )
  }
}