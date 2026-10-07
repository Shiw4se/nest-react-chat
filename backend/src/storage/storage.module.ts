import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { resolveUploadsRoot } from '../common/uploads';
import { FILE_STORAGE, FileStorage } from './file-storage';
import { LocalFileStorage } from './local-file-storage';
import { S3FileStorage } from './s3-file-storage';
import { ImageStorageService } from './image-storage.service';

export const isS3Driver = (config: ConfigService) =>
  config.get<string>('STORAGE_DRIVER') === 's3';

const createFileStorage = (config: ConfigService): FileStorage => {
  if (!isS3Driver(config)) {
    return new LocalFileStorage(
      resolveUploadsRoot(config.get<string>('UPLOADS_DIR')),
    );
  }

  const required = (name: string) => {
    const value = config.get<string>(name);
    if (!value) throw new Error(`${name} is required when STORAGE_DRIVER=s3`);
    return value;
  };

  const client = new S3Client({
    region: config.get<string>('S3_REGION') || 'auto',
    endpoint: config.get<string>('S3_ENDPOINT') || undefined,
    // Path-style URLs work with R2, MinIO and AWS alike
    forcePathStyle: true,
    credentials: {
      accessKeyId: required('S3_ACCESS_KEY_ID'),
      secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
    },
  });
  new Logger('StorageModule').log('Using S3-compatible storage');
  return new S3FileStorage(client, {
    bucket: required('S3_BUCKET'),
    publicUrl: required('S3_PUBLIC_URL'),
  });
};

@Global()
@Module({
  providers: [
    {
      provide: FILE_STORAGE,
      inject: [ConfigService],
      useFactory: createFileStorage,
    },
    ImageStorageService,
  ],
  exports: [FILE_STORAGE, ImageStorageService],
})
export class StorageModule {}
