const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');   // bcrypt for hashing
const User = require('../models/User');
var jwt = require('jsonwebtoken');
var fetchUser = require('../middleware/fetchUser')

const JWT_SECRET = 'singhSahil';

// Desc: Create a new user (Signup)
// Access: Public
// create user useing - Route 1: POST api/auth/createuser No create user required.

router.post('/createuser', [
    body('name', "Name must be at least 3 characters").isLength({ min: 3 }),
    body('email', "Please enter a valid email").isEmail(),
    body('password', "Password must be at least 5 characters").isLength({ min: 5 })
], async (req, res) => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: "User with this email already exists" });
        }

        // Hash password before saving (secure)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user (password stored as plain text not secure)
        user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // Prepare payload for JWT
        const payload = {
            user: {
                id: user.id
            }
        };

        // Sign JWT (valid for 1 hour)
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        // Return user info + JWT
        return res.status(201).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        });

        // only show token
        // return res.status(201).json({success: true, token})

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

//  Athontication a user login Route 2: POST "api/auth/login" , No Login reaqured.

router.post('/login', [
    body('email', "Please enter a valid email").isEmail(),
    body('password', "Password cannot be blank").exists()
], async (req, res) => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ error: " please try to correact creadetials" });
        }
        const passwordCompare = await bcrypt.compare(password, user.password)
        if (!passwordCompare) {
            return res.status(400).json({ error: " please try to correact creadetials" });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        //  return res.status(201).json({
        //     success: true,
        //     user: {
        //         id: user.id,
        //         name: user.name,
        //         email: user.email
        //     },
        //     token
        // });
        return res.status(201).json({ success: true, token })

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})

// Get Logged in user details Route 3 : using post method POS "/api/auth/getuser"  Login required

router.post('/getuser', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        res.send(user);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
