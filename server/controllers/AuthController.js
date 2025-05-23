const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Custom error handler function
const errorHandler = (status, message) => {
  const error = new Error();
  error.status = status;
  error.message = message;
  return error;
};

// Signup controller
const signup = async (req, res, next) => {
  const { name, role, email, password, confirmPassword, isActive = true } = req.body;

  // Input validation
  if (!name || !email || !password || !role || !confirmPassword) {
    return next(errorHandler(400, "All required fields must be provided"));
  }

  if (password.length < 6) {
    return next(errorHandler(400, "Password must be at least 6 characters"));
  }

  if (password !== confirmPassword) {
    return next(errorHandler(400, "Password and Confirm Password must match"));
  }

  // Validate role
  const validRoles = ["admin", "engineer", "technician"];
  if (!validRoles.includes(role)) {
    return next(errorHandler(400, "Invalid role specified"));
  }

  // Basic email format validation (optional, but recommended)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(errorHandler(400, "Invalid email format"));
  }

  try {
    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(errorHandler(400, "User already registered"));
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      isActive,
    });

    await newUser.save();

    // Return user data (excluding password) for consistency with signin
    const { password: pass, ...rest } = newUser._doc;
    return res.status(201).json({
      success: true,
      message: "Signup successful",
      user: rest,
    });
  } catch (error) {
    console.error("Signup error:", error);
    next(errorHandler(500, "Something went wrong. Please try again."));
  }
};

// Signin controller
const signin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password || email === "" || password === "") {
    return next(errorHandler(400, "All fields are required"));
  }

  try {
    const validUser = await User.findOne({ email });

    // If user doesn't exist
    if (!validUser) {
      return next(errorHandler(404, "User not found"));
    }

    // Check if user is locked out
    const currentTime = Date.now();
    if (
      validUser.failedLoginAttempts >= 3 &&
      validUser.lockUntil &&
      currentTime < validUser.lockUntil
    ) {
      const timeLeft = Math.ceil((validUser.lockUntil - currentTime) / 1000);
      return next(errorHandler(403, `Account locked. Try again in ${timeLeft} seconds.`));
    }

    // Validate password
    const validPassword = bcrypt.compareSync(password, validUser.password);

    if (!validPassword) {
      // Increment failed login attempts
      validUser.failedLoginAttempts = (validUser.failedLoginAttempts || 0) + 1;

      // Lock the user if they have reached 3 failed attempts
      if (validUser.failedLoginAttempts >= 3) {
        validUser.lockUntil = Date.now() + 2 * 60 * 1000; // Lock for 2 minutes
      }

      await validUser.save();
      return next(errorHandler(400, "Invalid password"));
    }

    // Reset failed login attempts and lockUntil on successful login
    validUser.failedLoginAttempts = 0;
    validUser.lockUntil = undefined;
    await validUser.save();

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      return next(errorHandler(500, "Server configuration error"));
    }

    // Generate JWT token
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = validUser._doc;

    res
      .status(200)
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .json(rest);
  } catch (error) {
    console.error("Signin error:", error);
    next(errorHandler(500, "Something went wrong. Please try again."));
  }
};

// Error middleware to format the response
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
  });
};

module.exports = { signup, signin, errorMiddleware };