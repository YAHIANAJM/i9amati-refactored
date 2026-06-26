import { z } from 'zod'

export const CreateFeedPostSchema = z.object({
  content: z.string({
    required_error: 'validation.postContent.required',
    invalid_type_error: 'validation.postContent.required',
  }).min(1, { message: 'validation.postContent.required' }).max(2000, { message: 'validation.postContent.tooLong' }),
})

export const UpdateFeedPostSchema = z.object({
  content: z.string({
    required_error: 'validation.postContent.required',
    invalid_type_error: 'validation.postContent.required',
  }).min(1, { message: 'validation.postContent.required' }).max(2000, { message: 'validation.postContent.tooLong' }),
})

export const CreateFeedCommentSchema = z.object({
  content: z.string({
    required_error: 'validation.commentContent.required',
    invalid_type_error: 'validation.commentContent.required',
  }).min(1, { message: 'validation.commentContent.required' }).max(1000, { message: 'validation.commentContent.tooLong' }),
})
