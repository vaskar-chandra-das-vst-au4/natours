/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

//@ type can be either data or password
export const updateSettings = async (data, type) => {
  const link = type === 'password' ? 'updateMyPassword' : 'updateMe';
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${link}`,
      data,
    });

    if (res.data.status === 'success')
      showAlert(
        'success',
        `${type[0].toUpperCase() + type.slice(1)} updated successfully!`
      );
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
