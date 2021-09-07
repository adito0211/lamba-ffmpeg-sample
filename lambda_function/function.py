import json
import os
import subprocess
import shlex
import boto3

SIGNED_URL_TIMEOUT = 60


def lambda_handler(event, context):

    s3_source_bucket = event['Records'][0]['s3']['bucket']['name']
    s3_source_key = event['Records'][0]['s3']['object']['key']

    s3_source_basename = os.path.splitext(os.path.basename(s3_source_key))[0]
    s3_destination_filename = s3_source_basename + "_thumbnail.jpg"

    s3_client = boto3.client('s3')
    s3_source_signed_url = s3_client.generate_presigned_url('get_object',
                                                            Params={
                                                                'Bucket': s3_source_bucket, 'Key': s3_source_key},
                                                            ExpiresIn=SIGNED_URL_TIMEOUT)

    ffmpeg_cmd = "/opt/bin/ffmpeg -i \"" + s3_source_signed_url + \
        "\" -f image2 -ss 1 -vframes 1 -vf scale=400:400:force_original_aspect_ratio=decrease -y -"
    command1 = shlex.split(ffmpeg_cmd)
    p1 = subprocess.run(command1, stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE)

    resp = s3_client.put_object(
        Body=p1.stdout, Bucket=s3_source_bucket, Key=s3_destination_filename)

    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete successfully')
    }
