/* eslint-disable */
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

export const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class = "alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 2000);
  //afterbegin - inside body 1st element.
  // type - error or success
};

//@ First remove all alerts once done it shows new alert
//@ then after 5sec that alert aslo got removed.
