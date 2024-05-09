const md5 = require('md5');
const bcrypt = require('bcryptjs');
const User = require('../models/model.js');
const AccessToken = require('../models/accessTokenModel.js');
const passport = require('passport');
var LocalStrategy = require('passport-local');
const config = require('../config/Constants.js');
const jwt = require('jsonwebtoken');
const multer = require('multer')
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)


const registerUser = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const existingEmail = await User.findOne({ where: { email : email } });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const newUser = await User.create({
            username,
            password: hashedPassword,
            email,
            firstName,
            lastName
        });

        const msg = {
            to: newUser.email,
            from: 'tiwarisanchit47@gmail.com',
            subject: 'Registration SuccessFul',
            text: 'Thank Your registering to the node.js application',
            }
            sgMail.send(msg)
            .then(() => 
            {
                console.log('Email sent')
            })
            .catch((error) => {
                console.error(error)
             })

        res.status(200).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const loginUser = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(400).json({ message: info.message });
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.status(200).json({ message: 'Logged in successfully' });
        });
    })(req, res, next);
};

const getUser = async (req, res) => {
    try {
        const userId = req.query.id;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const deleteUser = async (req, res) => {
    try {
        const access_token = req.headers['access_token'];
        const user = await User.findByPk(access_token);
        if (!user) {
            return res.status(400).json({ error: 'Invalid access token' });
        }
        await user.destroy();
        res.status(200).json({ message: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const listUsers = async (req, res) => {
    try {
        const page = parseInt(req.params.page);
        const usersPerPage = req.body.usersPerPage || config.usersPerPage;
        const offset = (page - 1) * usersPerPage; 
        const users = await User.findAll({ offset, limit: usersPerPage });
        res.status(200).json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const addAddress = async (req, res) => {
    try {
        const user_id = req.params.userId;
        const {address, city, state, pin_code, phone_no } = req.body;
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log(req.body);
        user.addresses.push({
            address,
            city,
            state,
            pin_code,
            phone_no
        });
        
        await user.save();

        res.status(200).json({ message: 'Address added successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const deleteAddresses = async (req, res) => {
    try {
        const { user_id, address_ids } = req.body;
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.addresses = user.addresses.filter(addr => !address_ids.includes(addr.id));

        await user.save();

        res.status(200).json({ message: 'Addresses deleted successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


const generatePasswordResetToken = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }
        const token = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: 15 * 60000 }
        );
        res.status(200).json({ token, message: "Token Expires in 15 minutes" });
        const msg = {
            to: user.email,
            from: 'tiwarisanchit47@gmail.com',
            subject: 'Password reset token generated',
            text: token,
        };
        sgMail.send(msg)
            .then(() => {
                console.log('Password Reset Token Email sent');
            })
            .catch((error) => {
                console.error(error);
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const verifyAndResetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        if (newPassword != confirmPassword) {
            return res.status(400).json({ message: "New password and confirm password do not match" });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (!decodedToken || !decodedToken.email) {
            return res.status(400).json({ message: "Invalid token" });
        }

        const user = await User.findOne({ where: { email: decodedToken.email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword; 
        await user.save();

        const msg = {
            to: user.email,
            from: 'tiwarisanchit47@gmail.com',
            subject: 'Password Reset Successful',
            text: 'Your Password was successfully resetted',
        };
        sgMail.send(msg)
            .then(() => {
                console.log('Password Reset Success Email sent');
            })
            .catch((error) => {
                console.error(error);
            });
        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error(error);
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: "Invalid or expired token" });
        } else {
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
};

module.exports = { registerUser, loginUser, getUser, deleteUser, listUsers, addAddress,deleteAddresses, generatePasswordResetToken, verifyAndResetPassword};
