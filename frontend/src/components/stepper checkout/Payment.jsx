import React, { useContext, useEffect, useReducer, useState } from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import { Helmet } from "react-helmet-async";
import stripe from "../../assets/payment/stripe.png";
import paypal from "../../assets/payment/paypal.png";
import { useNavigate, useParams } from "react-router-dom";
import { Context } from "../../context/Context";
import { getError } from "../utilities/util/Utils";
import { toast } from "react-toastify";
import axios from "axios";
import cash from "../../assets/cash.png";
import razorpay from "../../assets/razorpay.png";
import { request } from "../../base url/BaseUrl";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import StripeCheckout from "react-stripe-checkout";

const steps = ["Billing Address", "Confirmation", "Payment Method", "Finish"];
const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, order: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };

    case "PAY_REQUEST":
      return { ...state, loadingPay: true };
    case "PAY_SUCCESS":
      return { ...state, loadingPay: false, successPay: true };
    case "PAY_FAIL":
      return { ...state, loadingPay: false };
    case "PAY_RESET":
      return { ...state, loadingPay: false, errorPay: action.payload };

    default:
      return state;
  }
};
function Payment(props) {
  const navigate = useNavigate();

  const {} = props;

  let PayPal = "PayPal";
  let Stripe = "Stripe";
  let RazorPay = "RazorPay";
  let Cash = "Cash on Delivery";
  let PayStack = "PayStack";

  //ORDER POSTING
  const {
    state,
    dispatch: ctxDispatch,
    convertCurrency,
    toCurrency,
  } = useContext(Context);
  const {
    userInfo,
    settings,
    cart: { cartItems, paymentMethod },
  } = state;

  //PAYMENT METHOD
  const [paymentMethodName, setPaymentMethod] = useState(
    paymentMethod || PayPal
  );
  console.log(paymentMethodName);

  //STRIPE MODAL
  const [openStripeModal, is0penStripeModal] = useState(false);
  const closeStripeModal = () => {
    is0penStripeModal(false);
    document.body.style.overflow = "unset";
  };
  const showStripeModal = () => {
    is0penStripeModal(true);
  };

  const StripeModal = () => {
    closePaypalModal();
    // closePayStackModal();
    closeCashModal();
    closeRazorPayModal();
    showStripeModal();
  };

  //PAYPAL MODAL
  const [openPaypalModal, is0penPaypalModal] = useState(false);
  const closePaypalModal = () => {
    is0penPaypalModal(false);
    document.body.style.overflow = "unset";
  };
  const showPaypalModal = () => {
    is0penPaypalModal(true);
  };

  const PaypalOrderModal = () => {
    showPaypalModal();
    closeStripeModal();
    closeCashModal();
    closeRazorPayModal();
    // closePayStackModal();
  };

  //RAZORPAY
  const [openRazorPayModal, is0penRazorPayModal] = useState(true);
  const closeRazorPayModal = () => {
    is0penRazorPayModal(false);
    document.body.style.overflow = "unset";
  };
  const showRazorPayModal = () => {
    is0penRazorPayModal(true);
  };
  const RazorPayOrderModal = () => {
    closeStripeModal();
    closePaypalModal();
    closeCashModal();
    // closePayStackModal();
    showRazorPayModal();
  };

  //CASH MODAL
  const [openCashModal, is0penCashModal] = useState(false);
  const closeCashModal = () => {
    is0penCashModal(false);
    document.body.style.overflow = "unset";
  };
  const showCashModal = () => {
    is0penCashModal(true);
  };

  const CashOrderModal = () => {
    closeStripeModal();
    closePaypalModal();
    closeRazorPayModal();
    // closePayStackModal();
    showCashModal();
  };

  //=====================
  //PAYPAL BUTTONS ACTIONS
  //=====================
  const params = useParams();
  const { id: orderId } = params;

  const currencySign = toCurrency;

  const [{ loading, error, order, successPay, loadingPay }, dispatch] =
    useReducer(reducer, {
      loading: true,
      order: {},
      error: "",
      successPay: false,
      loadingPay: false,
    });
  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

  useEffect(() => {
    if (!userInfo) {
      return navigate("/login");
    }
    const fetchOrder = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`${request}/api/orders/${orderId}`, {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    if (!order._id || successPay || (order._id && order._id !== orderId)) {
      fetchOrder();
      if (successPay) {
        dispatch({ type: "PAY_RESET" });
      }
    } else {
      // const loadPaypalScript = () => {
      //   paypalDispatch({
      //     type: "resetOptions",
      //     value: {
      //       "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID,
      //       currency: toCurrency,
      //     },
      //   });
      //   paypalDispatch({ type: "setLoadingStatus", value: "pending" });
      // };
      // loadPaypalScript();
    }
  }, [
    navigate,
    order._id,
    orderId,
    paypalDispatch,
    successPay,
    toCurrency,
    userInfo,
  ]);

  //==========
  //PAYPAL
  //==========
  function createOrder(data, action) {
    return action.order
      .create({
        purchase_units: [{ amount: { value: order.grandTotal } }],
      })
      .then((orderID) => {
        return orderID;
      });
  }
  function onApprove(data, actions) {
    return actions.order.capture().then(async function (details) {
      try {
        dispatch({ type: "PAY_REQUEST" });
        const { data } = await axios.put(
          `${request}/api/orders/${order._id}/pay`,
          { details, paymentMethod: paymentMethodName, currencySign },
          {
            headers: { authorization: `Bearer ${userInfo.token}` },
          }
        );
        dispatch({ type: "PAY_SUCCESS", payload: data });

        toast.success("Order is paid", { position: "bottom-center" });
        if (order.isPaid) {
          navigate("/finish");
        }
      } catch (err) {
        dispatch({ type: "PAY_FAIL", payload: getError(err) });
        toast.error(getError(err), { position: "bottom-center" });
      }
    });
  }
  function onError(err) {
    toast.error(getError(err), { position: "bottom-center" });
  }

  //Navigation
  // useEffect(() => {
  //   if (order.isPaid) {
  //     navigate("/finish");
  //   }
  // }, [navigate, cartItems, order.isPaid]);

  const submitHandler = (e) => {
    e.preventDefault();
    // ctxDispatch({ type: "SAVE_PAYMENT_METHOD", payload: paymentMethodName });
    // localStorage.setItem("paymentMethod", paymentMethodName);
  };
  //============
  // CASH METHOD
  //============
  const cashSubmitHandler = async (details) => {
    try {
      // dispatch({ type: "PAY_REQUEST" });
      await axios.put(
        `${request}/api/orders/${order._id}/pay`,
        { details, paymentMethod: paymentMethodName, currencySign },
        {
          headers: { authorization: `Bearer ${userInfo.token}` },
        }
      );
      dispatch({ type: "PAY_SUCCESS" });
      toast.success("Approved for Cash on Delivery", {
        position: "bottom-center",
      });
      if (!order.isPaid) {
        navigate("/finish");
      }
    } catch (err) {
      dispatch({ type: "PAY_FAIL", payload: getError(err) });
      toast.error(getError(err), { position: "bottom-center" });
    }
  };

  //=========
  //RAZORPAY
  //=========
  const conversionRate = settings
    ?.map((s) => Number(s.rate))
    ?.find((rate) => !isNaN(rate));
  const razorGrandTotal = Math.floor(order.grandTotal * conversionRate);
  const razorPaySubmitHandler = async () => {
    try {
      if (razorGrandTotal > 500000) {
        toast.error("Payment amount exceeds the maximum limit for RazorPay", {
          position: "bottom-center",
        });
        return;
      }
      const response = await fetch(
        `${request}/api/orders/${order._id}/razorpay`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: razorGrandTotal,
            currency: toCurrency,
            paymentMethod: paymentMethodName,
            currencySign: toCurrency, // Include the paymentMethod property
          }),
        }
      );
      const razororder = await response.json();

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: parseInt(razorGrandTotal * 100),
        currency: toCurrency,
        name: "ProCanes",
        description: "payment",
        image: "https://your-store-logo.png", // URL of your store's logo
        order_id: razororder.id,
        handler: function (response) {
          dispatch({ type: "PAY_SUCCESS" });
          toast.success(`${response.razorpay_payment_id} Order is paid`, {
            position: "bottom-center",
          });
        },
        prefill: {
          name: `${userInfo.lastName} ${userInfo.firstName}`,
          email: userInfo.email,
        },
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      dispatch({ type: "PAY_FAIL", payload: getError(error) });
      toast.error(getError(error), { position: "bottom-center" });
    }
  };

  //=============
  //STRIPE METHOD
  //=============
  // const [amount, setAmount] = useState("");
  //  const [currency, setCurrency] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // const handleStripePayment = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await axios.post(
  //       `${request}/api/orders/payment`,
  //       {
  //         amount: order.grandTotal,
  //         currency: currency,
  //         token: {
  //           id: "pk_test_51LddZCG74SnLVBhQAzsedUUcKxd33HOpAIThNyxKl2l4mxvCj8uywmQFZHNq5EmiIn6jNrAVGrBqT1tWHprcD3XF00xOSuchsE",
  //           card: {
  //             number: cardNumber,
  //             exp_month: expiry.split("/")[0],
  //             exp_year: expiry.split("/")[1],
  //             cvc: cvc,
  //           },
  //         },
  //         orderId: orderId, // Pass the actual order ID here
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer sk_test_51LddZCG74SnLVBhQgEpJEtwmrZun228Px4rYGTLUZ1xC81NzN2TP2svtDGXT3UPaYcEy8jtfj6X6k5EbzcEROpFu00eKwTYye4`,
  //         },
  //       }
  //     );
  //     console.log(response.data);
  //     setIsLoading(false);
  //     setErrorMessage("");
  //   } catch (error) {
  //     console.error(error);
  //     setIsLoading(false);
  //     setErrorMessage("An error occurred while processing the payment");
  //   }
  // };
  const handleToken = async (token) => {
    try {
      const response = await axios.post(
        `${request}/api/orders/payment`,
        {
          amount: order.grandTotal * 100, // Amount in cents
          currency: toCurrency,
          token: token,
          orderId: orderId, // Pass the actual order ID here
        },
        {
          headers: {
            Authorization: `Bearer sk_test_51LddZCG74SnLVBhQgEpJEtwmrZun228Px4rYGTLUZ1xC81NzN2TP2svtDGXT3UPaYcEy8jtfj6X6k5EbzcEROpFu00eKwTYye4`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(response.data);
      // Handle the response or update your UI accordingly
    } catch (error) {
      console.error(error);
      // Handle the error or display an error message
    }
  };

  return (
    <>
      <div className="form_container">
        <Helmet>
          <title>Checkout</title>
        </Helmet>
        <div className="mtb form_box_content">
          <Box sx={{ width: "100%" }}>
            <Stepper activeStep={2} alternativeLabel>
              {steps?.map((label) => (
                <Step key={label}>
                  <StepLabel>
                    <span className="labelProps">{label}</span>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          <div className="payment">
            <form action="" onSubmit={submitHandler}>
              <div className="choose_method p_flex">
                <span className="choose_method_box">
                  <div className=" d_grid mtb">
                    <label
                      className={
                        openRazorPayModal
                          ? "active payment_label"
                          : "payment_label"
                      }
                      htmlFor="razorpay"
                      onClick={RazorPayOrderModal}
                    >
                      <div className="label-svg">
                        <div className="svg">
                          <img src={razorpay} alt="" />
                        </div>
                        <span className="a_flex input_text">
                          <input
                            type="radio"
                            required
                            name="payment"
                            id="razorpay"
                            value={RazorPay}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          />
                          <span>
                            <strong>
                              Pay{" "}
                              {convertCurrency(order.grandTotal?.toFixed(2))}
                              &#160; with RazorPay
                            </strong>
                          </span>
                        </span>
                      </div>
                    </label>
                    {/* <label
                      className={
                        openStripeModal
                          ? "active payment_label"
                          : "payment_label"
                      }
                      htmlFor="stripe"
                      onClick={StripeModal}
                    >
                      <div className="label-svg">
                        <div className="svg">
                          <img src={stripe} alt="" />
                        </div>
                        <span className="a_flex input_text">
                          <input
                            type="radio"
                            required
                            name="payment"
                            id="stripe"
                            value={Stripe}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          />
                          <span>
                            <strong>
                              Pay{" "}
                              {convertCurrency(order.grandTotal?.toFixed(2))}
                              &#160; with credit card
                            </strong>
                          </span>
                        </span>
                      </div>
                    </label> */}
                    <label
                      className={
                        openPaypalModal
                          ? "active payment_label "
                          : "payment_label "
                      }
                      htmlFor="paypal"
                      onClick={PaypalOrderModal}
                    >
                      <div className="label-svg">
                        <div className="svg">
                          <img src={paypal} alt="" />
                        </div>

                        <span className="a_flex input_text">
                          <input
                            type="radio"
                            required
                            checked={openPaypalModal === true}
                            name="payment"
                            id="paypal"
                            value={PayPal}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          />
                          <span>
                            <strong>
                              Pay{" "}
                              {convertCurrency(order.grandTotal?.toFixed(2))}{" "}
                              with PayPal
                            </strong>
                          </span>
                        </span>
                      </div>
                    </label>
                    <label
                      className={
                        openCashModal
                          ? "active payment_label "
                          : "payment_label "
                      }
                      htmlFor="cash"
                      onClick={CashOrderModal}
                    >
                      <div className="label-svg">
                        <div className="svg">
                          <img src={cash} alt="" className="cash_img" />
                        </div>

                        <span className="a_flex input_text">
                          <input
                            type="radio"
                            required
                            name="payment"
                            id="cash"
                            value={Cash}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          />
                          <span>
                            <strong>
                              Pay{" "}
                              {convertCurrency(order.grandTotal?.toFixed(2))}
                              &#160; with Cash on Delivery
                            </strong>
                          </span>
                        </span>
                      </div>
                    </label>
                  </div>
                  <div className="paypal-stripe">
                    {!order.isPaid && (
                      <div>
                        {openStripeModal && (
                          <div className="stripe-details">
                            {/* <div className="p-inner-form">
                              <div className="form-group">
                                <label htmlFor="card-holder">
                                  Cardholder's Name
                                </label>
                                <div className="payment-input-box">
                                  <input
                                    type="text"
                                    id="name"
                                    disabled
                                    placeholder="Name"
                                  />
                                  <i className="fa fa-user"></i>
                                </div>
                              </div>
                              <div className="form-group">
                                <label htmlFor="card-number">Card Number</label>
                                <div className="payment-input-box">
                                  <input
                                    type="tel"
                                    id="card-number"
                                    name="card-number"
                                    disabled
                                    value={cardNumber}
                                    onChange={(e) =>
                                      setCardNumber(e.target.value)
                                    }
                                    inputMode="numeric"
                                    pattern="[\d ]{10,30}"
                                    // maxLength="16"
                                    placeholder="**** **** **** ****"
                                  />
                                  <i className="fa fa-credit-card"></i>
                                </div>
                              </div>
                              <div className="form-date">
                                <div className="form-group-d">
                                  <label htmlFor="card-date">Valid thru.</label>
                                  <div className="cvc-fa-icon">
                                    <input
                                      type="text"
                                      value={expiry}
                                      disabled
                                      onChange={(e) =>
                                        setExpiry(e.target.value)
                                      }
                                      placeholder="MM/YY"
                                    />
                                  </div>
                                </div>
                                <div className="form-group-d">
                                  <label htmlFor="card-cvv">CVV / CVC*</label>
                                  <div className="cvc-fa-icon">
                                    <input
                                      type="tel"
                                      id="cvv"
                                      disabled
                                      value={cvc}
                                      onChange={(e) => setCvc(e.target.value)}
                                      maxLength="3"
                                      pattern="[0-9]{3}"
                                      placeholder="cvv"
                                    />
                                    <i className="fa fa-lock" id="passcvv"></i>
                                  </div>
                                </div>
                              </div>
                              <div className="form-group">
                                <span>
                                  * CVV or CVC is the card security code, unique
                                  three digits number on the back of your card
                                  separate from its number
                                </span>
                              </div>
                              {errorMessage && <p>{errorMessage}</p>}
                              <div className="stripe_btn">
                                <button
                                  onClick={handleStripePayment}
                                  disabled={isLoading}
                                >
                                  {isLoading ? "Processing..." : "Pay"}
                                </button>
                              </div>
                            </div> */}
                            {/* <StripeCheckout
                              token={handleToken}
                              stripeKey="pk_test_51LddZCG74SnLVBhQAzsedUUcKxd33HOpAIThNyxKl2l4mxvCj8uywmQFZHNq5EmiIn6jNrAVGrBqT1tWHprcD3XF00xOSuchsE"
                              amount={order?.grandTotal * 100} // Amount in cents
                              currency={currency}
                              name="My Store"
                              description="Example Purchase"
                            >
                              <button>Pay with Stripe</button>
                            </StripeCheckout> */}
                          </div>
                        )}
                        {openPaypalModal && (
                          <div className="paypal-details">
                            {/* {!order.isPaid && ( */}
                            <div className="paypal-btn">
                              {/* {isPending && ( */}
                              <PayPalButtons
                                createOrder={createOrder}
                                onApprove={onApprove}
                                onError={onError}
                              ></PayPalButtons>
                              {/* )} */}
                            </div>
                            {/* )} */}
                          </div>
                        )}
                        {/* {openPayStackModal && (
                        <div className="paypal-details paystack_btn">
                          <PaystackButton
                            {...componentProps}
                            className="paystack_btn_style"
                          />
                        </div>
                      )} */}
                        {openCashModal && (
                          <div className="paypal-details paystack_btn cash_btn_style">
                            <button
                              className="cash_btn l_flex"
                              onClick={cashSubmitHandler}
                            >
                              <img src={cash} alt="" />
                              <span className="cash_text">
                                Cash on Delivery
                              </span>
                            </button>
                          </div>
                        )}
                        {openRazorPayModal && (
                          <div className="paypal-details paystack_btn cash_btn_style">
                            <button
                              className="cash_btn l_flex"
                              onClick={razorPaySubmitHandler}
                            >
                              <img src={razorpay} alt="" />
                              {/* <span className="cash_text">
                                
                              </span> */}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default Payment;
