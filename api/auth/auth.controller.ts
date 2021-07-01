import { MongoClient } from "mongodb";
import { getDbClient } from "../services/mongodb.service";
import { NextApiRequest, NextApiResponse } from "next";
import { NextHandler } from "next-connect";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import {
  UserSignup,
  JwtPayload,
  UserOTPRequest,
  UserDB,
  UserLogin,
  userSignupSchema,
} from "./auth.schema";
import { errors } from "../error/error.constant";

export const postLogin = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: NextHandler
) => {
  try {
    let { password } = req.body;
    const dbClient: MongoClient = await getDbClient();

    let body = req.body as UserLogin;
    delete body["password"];

    let result = await dbClient.db().collection("users").findOne<UserDB>(body);
    if (!result) {
      throw errors.USER_NOT_FOUND;
    }

    if (await bcrypt.compare(password, result.password)) {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw errors.MISSING_ENV_VARIABLES;
      }

      const token = jwt.sign(
        { email: result.email, _id: result._id },
        jwtSecret,
        {
          expiresIn: "1d",
          issuer: "srmkzilla",
        }
      );
      res.status(200).json({
        success: true,
        authToken: token,
      });
    } else {
      throw errors.WRONG_PASSWORD;
    }
  } catch (err) {
    next(err);
  }
};

export const postSignup = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: NextHandler
) => {
  try {
    let { username, email, password } = req.body as UserSignup;
    const dbClient: MongoClient = await getDbClient();
    let result = await dbClient
      .db()
      .collection("users")
      .findOne<UserDB>({ email: email });
    const saltRounds = 12;
    if (result) {
      throw errors.DUPLICATE_USER;
    }
    let usernameExists = await dbClient
      .db()
      .collection("users")
      .findOne<UserDB>({ username: username });
    if (usernameExists) {
      throw errors.DUPLICATE_USERNAME;
    }
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);

    let user = {
      email,
      password: hash,
      username,
    };
    const validatedUser = userSignupSchema.cast(user);

    const data = await dbClient
      .db()
      .collection("users")
      .insertOne(validatedUser);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw errors.MISSING_ENV_VARIABLES;
    }
    if (!data) {
      throw errors.MONGODB_QUERY_ERROR;
    }
    const token = jwt.sign({ email, _id: data.ops[0]._id }, jwtSecret, {
      expiresIn: "1d",
      issuer: "srmkzilla",
    });

    res.status(200).json({
      success: true,
      authToken: token,
    });
  } catch (err) {
    next(err);
  }
};

export const getOTP = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: NextHandler
) => {
  try {
    let payload = req.env.user;
    let user: JwtPayload = JSON.parse(payload);
    if (!user) {
      throw errors.USER_NOT_FOUND;
    }
    const dbClient: MongoClient = await getDbClient();

    const OTP = Math.floor(100000 + Math.random() * 900000);
    const createdAt = new Date().getTime();
    
    await dbClient
      .db()
      .collection("otp")
      .insertOne({
        email: user.email,
        otp: OTP,
        createdAt: createdAt,
        expiresAt: createdAt + 10 * 60000,
      });
    return res.status(200).json({
      success: true,
      otp: OTP,
      createdAt: createdAt,
      expiresAt: createdAt + 10 * 60000,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyOTP = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: NextHandler
) => {
  try {
    let payload = req.env.user;
    let user: JwtPayload = JSON.parse(payload);
    if (!user) {
      throw errors.USER_NOT_FOUND;
    }

    const userRequest = req.body as UserOTPRequest;
    if (!userRequest) {
      throw errors.INVALID_OTP;
    }

    const dbClient: MongoClient = await getDbClient();
    const databaseOTP = await dbClient
      .db()
      .collection("otp")
      .findOne({ otp: userRequest.otp });
    if (!databaseOTP) {
      throw errors.INVALID_OTP; //if otp by user doesn't match any otp in database
    }

    if (databaseOTP.email === user.email) {
      if (databaseOTP.expiresAt < new Date().getTime()) {
        throw errors.OTP_EXPIRED;
      }

      await dbClient.db().collection("otp").deleteOne({ _id: databaseOTP._id });
      return res.status(200).json({
        success: true,
      });
    } else {
      throw errors.INVALID_OTP; //when a user enters an otp that another user got
      //(when email in token doesn't match the email in database but the otp in request and the database matches)
    }
  } catch (err) {
    next(err);
  }
};
