import express from "express";
import { v4 as uuidv4 } from "uuid";
import { newUserValidation } from "../validationMiddlewarw/userValidation.js";
import { comparePassword, hashPassword } from "../utility/bcryptHelper.js";
import {
  createUser,
  findUserByEmail,
  getUsers,
  updateUser,
} from "../model/userModel.js";
import { createSession, deleteSession } from "../model/sessionModel.js";
import {
  sendAccountVerifiedEmail,
  sendResetPasswordLinkEmail,
  sendVerificationLinkEmail,
} from "../utility/nodemailerHelper.js";
import {
  buildErrorResponse,
  buildSuccessResponse,
} from "../utility/responseHelper.js";
import { generateJWTs } from "../utility/jwtHelper.js";
import {
  adminAuth,
  refreshAuth,
} from "../middleware/authMiddleware/authMiddleware.js";

const userRouter = express.Router();

// CREATE USER  |POST | SIGNUP
userRouter.post("/", newUserValidation, async (req, res) => {
  try {
    // hash the password
    const { password } = req.body;

    const encryptedPassword = hashPassword(password);

    // create user in db
    const user = await createUser({
      ...req.body,
      password: encryptedPassword,
    });

    // if user is created, send a verifications email
    if (user?._id) {
      const secureId = uuidv4();
      // store this id in session storage against user email
      const session = await createSession({
        token: secureId,
        userEmail: user.email,
      });

      if (session?._id) {
        // create verificaation link and send verification email
        const verificationUrl = `${process.env.CLIENT_ROOT_URL}/verify-email?e=${user.email}&id=${secureId}`;

        // Now send an email
        sendVerificationLinkEmail(user, verificationUrl);
      }
    }
    user?._id
      ? buildSuccessResponse(
          res,
          {},
          "Check your inbox/spam to verify your email"
        )
      : buildErrorResponse(res, "Could not register the user");
  } catch (error) {
    if (error.code === 11000) {
      error.message = "User with this email already exists!!";
    }
    buildErrorResponse(res, error.message);
  }
});

// PUBLIC | Verify user email
userRouter.patch("/verify-email", async (req, res) => {
  try {
    const { userEmail, token } = req.body;

    if (userEmail && token) {
      const result = await deleteSession({ token, userEmail });

      // if token existed in session against this user
      if (result?._id) {
        // update our user to set isVerified true
        const user = await updateUser(
          { email: userEmail },
          { isVerified: true }
        );
        if (user?._id) {
          // send account verified email and welcome email
          sendAccountVerifiedEmail(user, process.env.CLIENT_ROOT_URL);
          buildSuccessResponse(res, {}, "Your email is verified");

          return;
        }
      }
      return;
    }
    return buildErrorResponse(res, "Account Cannot be verified");
  } catch (error) {
    if (error.code === 11000) {
      error.message = "User with this email already exists!!";
    }
    buildErrorResponse(res, "Account Cannot be verified");
  }
});

// Login| public | post
userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await findUserByEmail(email);

    // return error if user is not found or user is not verified
    if (!user?._id) {
      return buildErrorResponse(res, "User account does not exist!");
    }

    if (!user?.isVerified) {
      return buildErrorResponse(res, "User is not verified");
    }

    // Compare password
    const isPasswordMatched = comparePassword(password, user.password);

    // Generate and send back tokens
    if (isPasswordMatched) {
      const jwt = await generateJWTs(user.email);

      return buildSuccessResponse(res, jwt, "Logged in Successfully");
    }
    return buildErrorResponse(res, "Invalid Credentials");
  } catch (error) {
    buildErrorResponse(res, "Invalid Credentials");
  }
});

//UPDATE a user || private | patch
userRouter.patch("/", adminAuth, async (req, res) => {
  try {
    // Destructure the _id and other formdata from req.body
    const { _id, ...updatedUser } = req.body;

    // update user in db
    const user = await updateUser({ _id }, updatedUser);

    // Check if the update was successful
    user?._id
      ? buildSuccessResponse(res, user, "User updated successfully")
      : buildErrorResponse(res, "Could not update user");
  } catch (error) {
    console.error("Error updating user:", error);
    buildErrorResponse(res, "Could not update user");
  }
});

//LOGOUT USER | private | post
// userRouter.post("/logout", adminAuth, async (req, res) => {
//   try {
//     const { email } = req.body;
//     const { authorization } = req.headers;

//     //remove session for the user
//     await deleteSession({ token: authorization, userEmail: email });

//     buildSuccessResponse(res, {}, "Bye, See you again!!");
//   } catch (error) {
//     buildErrorResponse(res, error.message);
//   }
// });
userRouter.post("/logout", adminAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const { authorization } = req.headers;

    // Remove session for the user
    const result = await deleteSession({
      token: authorization,
      userEmail: email,
    });

    // Use ternary operator to handle success or failure
    result
      ? buildSuccessResponse(res, {}, "Bye, See you again!!")
      : buildErrorResponse(res, "Session not found or already deleted.");
  } catch (error) {
    buildErrorResponse(res, error.message);
  }
});

// PRIVATE ROUTES | get the user
userRouter.get("/", adminAuth, async (req, res) => {
  try {
    buildSuccessResponse(res, req.userInfo, "User Info");
  } catch (error) {
    buildErrorResponse(res, error.message);
  }
});

// GET NEW ACCESS TOKEN
userRouter.get("/accessjwt", refreshAuth);

// GET ALL Users | Private ROUTE
userRouter.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await getUsers();

    users?.length
      ? buildSuccessResponse(res, users, "Users")
      : buildErrorResponse(res, "Could not fetch users");
  } catch (error) {
    buildErrorResponse(res, "Could not fetch users");
  }
});

//FORGET PASSWORD
userRouter.post("/forget-password", async (req, res) => {
  try {
    const { email } = req.body;

    // find if the user exists
    const user = await findUserByEmail(email);

    if (!user?._id) {
      return buildErrorResponse(res, "User does not exists. Please signup!!");
    }

    if (user?._id) {
      // if user is created send a verification email
      const secureID = uuidv4();

      //   store this secure ID in session storage for that user
      const newUserSession = await createSession({
        userEmail: user.email,
        token: secureID,
      });

      if (newUserSession?._id) {
        // create verification link and send verification email
        const resetUrl = `${process.env.CLIENT_ROOT_URL}/change-password?e=${user.email}&id=${secureID}`;

        // send the email
        sendResetPasswordLinkEmail(user, resetUrl);
      }
    }
    user?._id
      ? buildSuccessResponse(
          res,
          {},
          "Check your inbox/spam to reset your password"
        )
      : buildErrorResponse(res, "Could not send  mail to your inbox");
  } catch (error) {
    console.log(error.message);
    buildErrorResponse(res, error.message);
  }
});

//   CHANGE PASSWORD
userRouter.patch("/change-password", async (req, res) => {
  try {
    const { formData, token, userEmail } = req.body;
    console.log("req.body", req.body);

    // check if the user exists
    const user = await findUserByEmail(userEmail);
    console.log("user:", user);

    // check if the token exists
    const result = await deleteSession({ token, userEmail });
    console.log("result", result);

    if (user && result) {
      const { password } = formData;
      const encryptPassword = hashPassword(password);
      const updatePassword = await updateUser(
        { email: userEmail },
        { password: encryptPassword }
      );
      buildSuccessResponse(
        res,
        updatePassword,
        "Password Reset successfully!!"
      );
    } else {
      buildErrorResponse(res, "Token expired or invalid. Please try again");
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    buildErrorResponse(res, "Can not reset password. Please try again");
  }
});
export default userRouter;
