/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async tourId => {
  const stripe = Stripe(
    'pk_test_51LrGZ2SGKy166rvY8EvwugOT1kTPrVt5VnrXJg7WT5BCRrmrhkCMs7TRoQX973dVPsXBN1G67W14fvFDzxfI329o00vPR7ocGo'
  );
  try {
    //1) Get checkout session from API
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);
    // console.log(session);
    //2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
