
import express from 'express';
import getUsersRouter from './getUsers.js';
import getUserByIdRouter from './getUserById.js';
import createUserRouter from './createUser.js';
import updateUserRouter from './updateUser.js';
import deleteUserRouter from './deleteUser.js';

const router = express.Router();

// Mount all user routes
router.use('/', getUsersRouter);
router.use('/', getUserByIdRouter);
router.use('/', createUserRouter);
router.use('/', updateUserRouter);
router.use('/', deleteUserRouter);

export default router;
