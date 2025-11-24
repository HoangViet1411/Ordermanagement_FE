import Joi from 'joi';

// Schema for Sign Up
export const signUpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': 'email must be a string',
    'string.email': 'email must be a valid email address',
    'any.required': 'email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.base': 'password must be a string',
    'string.min': 'password must be at least 8 characters long',
    'any.required': 'password is required',
  }),
});

// Schema for Sign In
export const signInSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': 'email must be a string',
    'string.email': 'email must be a valid email address',
    'any.required': 'email is required',
  }),
  password: Joi.string().required().messages({
    'string.base': 'password must be a string',
    'any.required': 'password is required',
  }),
});

