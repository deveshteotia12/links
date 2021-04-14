import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import {
  postLogin,
  postSignup,
  getUser,
  getOTP,
  verifyOTP,
  editProfile,
} from "./auth.controller";
import { onError, onNotFound } from "../error/error.controller";
import { validateQuery } from "../middlewares/verifyQuery.middleware";
import { validateUser } from "../middlewares/verifyJWT.middleware";
import { userInfoSchema, userLoginSchema, userOTPRequestSchema, userSignupSchema } from "./auth.schema";

const authHandler = nc<NextApiRequest, NextApiResponse>({
  onNoMatch: onNotFound,
  onError: onError,
});

authHandler
  .post("/login", validateQuery("body", userLoginSchema), postLogin)
  .post("/signup", validateQuery("body", userSignupSchema), postSignup)
  .get("/user", validateUser, getUser)
  .get("/getotp", validateUser, getOTP)
  .post("/postotp", validateQuery("body", userOTPRequestSchema), validateUser, verifyOTP)
  .patch("/editprofile", validateQuery("body", userInfoSchema), validateUser, editProfile);

export default authHandler;
