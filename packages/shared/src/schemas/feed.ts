import { z } from 'zod'

export const CreateFeedPostSchema = z.object({
  content: z.string({
    required_error: 'validation.postContent.required',
    invalid_type_error: 'validation.postContent.required',
  }).min(1, { message: 'validation.postContent.required' }).max(2000, { message: 'validation.postContent.tooLong' }),
})
