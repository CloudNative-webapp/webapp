const Joi = require('joi');

// const taskSchema = {
//     username: Joi.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).required(),
//     password: Joi.string(),
//     firstname: Joi.string(),
//     lastname: Joi.string()
// };

const taskSchema = Joi.object({
    username: Joi.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).required(),
    password: Joi.string(),
    firstname: Joi.string(),
    lastname: Joi.string()
});

exports.validateTask = (task) => taskSchema.validate(task,taskSchema);