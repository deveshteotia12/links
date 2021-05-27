import React, { useState } from "react";
import Fade from "react-reveal/Fade";
import { parseCookies } from "nookies";
import { GrFormClose } from "react-icons/gr";
import { Formik, Field, Form } from "formik";

import { passwordValidationSchema } from "../../utils/schema";
import { patchNewPassword } from "../../utils/api";
import { Eye, EyeHide, LoadingAuth } from "../../assets/icons"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({ isOpen, onClose }: ModalProps): JSX.Element => {
  const [passwordShown, setPasswordShown] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const togglePasswordVisiblity = () => {
    setPasswordShown(passwordShown ? false : true);
  };
  const submitNewPassword = (oldPassword, newPassword) => {
    setLoading(true);
    const values: Object = {
      oldPassword: oldPassword,
      newPassword: newPassword,
    };
    const { authToken } = parseCookies();
    (async () => {
      const _res = await patchNewPassword(authToken, values);
      if (_res) {
        setLoading(false);
        onClose();
      }
      else {
        setLoading(false);
      }
    })();
  };

  const initialValues = {
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  };
  return (
    <>
      {isOpen && (
        <div className="fixed z-50 top-0 right-0 bottom-0 left-0">
          <div className="fixed top-0 bottom-0 left-0 right-0 z-0 bg-backdrop">
            <Fade bottom duration={500}>
              <div className="fixed bottom-0 p-8 md:left-1/3 w-full md:w-1/3 bg-white rounded-t-lg shadow-2xl">
                <a onClick={onClose} className="float-right cursor-pointer">
                  <GrFormClose size={24} />
                </a>
                <h1 className="text-lightblue font-extrabold text-3xl text-center">
                  Change Password
                </h1>
                <Formik
                  initialValues={initialValues}
                  onSubmit={(values) =>
                    submitNewPassword(values.oldPassword, values.newPassword)
                  }
                  validationSchema={passwordValidationSchema}
                >
                  {({ errors }) => (
                    <Form>
                      <Field
                        name="oldPassword"
                        type="password"
                        className="gradientInput mb-4 mt-10 outline-none focus:outline-none block appearance-none w-full bg-lightgray px-2 py-2"
                        placeholder="Current Password"
                        autoFocus
                      />
                      {errors.oldPassword && (
                        <div className="text-red-500 text-sm -mt-4 mb-3">
                          {errors.oldPassword}
                        </div>
                      )}
                      <div className="relative">
                        <Field
                          name="newPassword"
                          type={passwordShown ? 'text' : 'password'}
                          className="gradientInput mb-4 outline-none focus:outline-none block appearance-none w-full bg-lightgray px-2 py-2"
                          placeholder="New Password"
                        />
                        <i
                          className="absolute top-4 right-3 cursor-pointer"
                          onClick={togglePasswordVisiblity}
                        >
                          {passwordShown ? <EyeHide /> : <Eye />}
                        </i>
                      </div>
                      {errors.newPassword && (
                        <div className="text-red-500 text-sm -mt-4 mb-3">
                          {errors.newPassword}
                        </div>
                      )}
                      <Field
                        name="confirmNewPassword"
                        type="password"
                        className="gradientInput mb-4 outline-none focus:outline-none block appearance-none w-full bg-lightgray px-2 py-2"
                        placeholder="Confirm New Password"
                      />
                      {errors.confirmNewPassword && (
                        <div className="text-red-500 text-sm -mt-4 mb-3">
                          {errors.confirmNewPassword}
                        </div>
                      )}
                      <div className="flex items-center justify-center relative">
                        <button
                          type="submit"
                          className="bg-lightblue focus:outline-none hover:bg-opacity-90 text-darkgray w-2/3 text-md shadow-lg font-extrabold py-3 px-4 my-2 rounded"
                        >
                          {loading && <div className="absolute left-1/2"><LoadingAuth /></div>}<div className={`${loading && "invisible"}`}>Save</div>
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </Fade>
          </div>
        </div>
      )}
    </>
  );
};
export default ChangePasswordModal;
