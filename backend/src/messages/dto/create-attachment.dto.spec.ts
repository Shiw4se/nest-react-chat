import { ValidationPipe } from '@nestjs/common';
import { CreateAttachmentDto } from './create-attachment.dto';

// Same options as the global pipe in main.ts
const pipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});
const validate = (body: object) =>
  pipe.transform(body, { type: 'body', metatype: CreateAttachmentDto });

describe('CreateAttachmentDto', () => {
  it('accepts a multipart body with only the text fields', async () => {
    // Regression: a documentation-only `file` property used to be rejected
    // as "property file should not exist"
    await expect(validate({ caption: 'Sunset' })).resolves.toMatchObject({
      caption: 'Sunset',
    });
    await expect(validate({})).resolves.toBeDefined();
  });

  it('rejects unknown fields and bad reply ids', async () => {
    await expect(validate({ hacker: 1 })).rejects.toBeDefined();
    await expect(validate({ replyToId: 'nope' })).rejects.toBeDefined();
  });
});
