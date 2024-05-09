const express = require('express');
const router = express.Router();
const { validateRegistration, validate } = require('../middlewares/validation');
const { registerUser, getUser, deleteUser, listUsers, addAddress, deleteAddresses,generatePasswordResetToken,verifyAndResetPassword} = require('../controllers/controller');
const passport = require('passport')
const {uploadProfilePhoto} = require('../fileUpload/multer.js')
const {onlineUpload} = require('../fileUpload/cloudinary.js')


router.post('/users/register', validateRegistration, validate, registerUser);

router.post('/users/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {        //authentication Failed
            return res.status(401).json({ message: 'Invalid username or password' });
        }
                            // authentication successful
        return res.status(200).json({ message: 'Login successful', user: user });
    })(req, res, next);
});

router.get('/users/:userId',getUser);

router.delete('/users/:userId',deleteUser);

router.get('/users/list/:page', listUsers);

router.post('/users/:userId/address', addAddress);

router.delete('/users/:userId/address', deleteAddresses);

router.post('/users/forgot-password', generatePasswordResetToken);

router.put('/users/verify-reset-password/:password-reset-token', verifyAndResetPassword);

router.put('/users/profile-image', uploadProfilePhoto);

router.put('/users/profile-image-online',onlineUpload);

const userRoutes = router;
module.exports = userRoutes;