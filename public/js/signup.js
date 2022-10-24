/* eslint-disable */
import axios from 'axios';
import { showAlert, hideAlert } from './alerts';

export const signup = async data => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data,
    });
    if (res.data.status === 'success') {
      hideAlert();
      showAlert('success', 'Sign Up successfully!', 2);
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
