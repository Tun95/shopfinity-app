import React, {
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import "../styles/styles.scss";
import { useParams } from "react-router-dom";
import { Context } from "../../../context/Context";
import axios from "axios";
import { toast } from "react-toastify";
import { getError } from "../../utilities/util/Utils";
import "react-phone-number-input/style.css";
import LoadingBox from "../../utilities/message loading/LoadingBox";
import MessageBox from "../../utilities/message loading/MessageBox";
import { Helmet } from "react-helmet-async";
import PublishIcon from "@mui/icons-material/Publish";
import JoditEditor from "jodit-react";
import photo from "../../../assets/photo.jpg";
import me from "../../../assets/me.png";
import { request } from "../../../base url/BaseUrl";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, user: action.payload };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };

    case "CREATE_REQUEST":
      return { ...state, loading: true };
    case "CREATE_SUCCESS":
      return { ...state, loading: false };
    case "CREATE_FAIL":
      return { ...state, loading: false };

    case "UPDATE_REQUEST":
      return { ...state, loadingUpdate: true };
    case "UPDATE_SUCCESS":
      return { ...state, loadingUpdate: false };
    case "UPDATE_FAIL":
      return { ...state, loadingUpdate: false };

    default:
      return state;
  }
};
function Vendor() {
  const editor = useRef(null);

  const params = useParams();
  const { id: userId } = params;
  const { state, dispatch: ctxDispatch } = useContext(Context);
  const { userInfo } = state;
  console.log(userInfo);

  const [{ loading, error, user }, dispatch] = useReducer(reducer, {
    loading: true,
    error: "",
    loadingUpdate: false,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [image, setImage] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerLogo, setSellerLogo] = useState("");
  const [sellerDescription, setSellerDescription] = useState("");

  //==============
  //FETCH HANDLER
  //==============
  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(
          `${request}/api/users/info/${userId}`,
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }
        );
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
        setPhone(data.phone);
        setAddress(data.address);
        setCountry(data.country);
        setImage(data.image);

        setSellerName(data?.seller?.name);
        setSellerLogo(data?.seller?.logo);
        setSellerDescription(data?.seller?.description);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchData();
  }, [userId, userInfo]);

  //==============
  //SUBMIT HANDLER
  //==============
  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      dispatch({ type: "UPDATE_REQUEST" });
      const { data } = await axios.put(
        `${request}/api/users/profile`,
        {
          firstName,
          lastName,
          email,
          phone,
          address,
          image,
          country,
          sellerName,
          sellerLogo,
          sellerDescription,
        },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
      );
      dispatch({ type: "UPDATE_SUCCESS" });
      ctxDispatch({
        type: "USER_SIGNIN",
        payload: data,
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      toast.success("Vendor profile updated successfully", {
        position: "bottom-center",
      });
    } catch (err) {
      dispatch({ type: "UPDATE_FAIL" });
      toast.error(getError(err), { position: "bottom-center" });
    }
  };

  //==============
  //PROFILE PICTURE
  //===============
  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    const bodyFormData = new FormData();
    bodyFormData.append("file", file);
    try {
      dispatch({ type: "UPLOAD_REQUEST" });
      const { data } = await axios.post(`${request}/api/upload`, bodyFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
          authorization: `Bearer ${userInfo.token}`,
        },
      });
      dispatch({ type: "UPLOAD_SUCCESS" });
      toast.success("Image uploaded successfully", {
        position: "bottom-center",
      });
      setImage(data.secure_url);
    } catch (err) {
      toast.error(getError(err), { position: "bottom-center" });
      dispatch({ type: "UPLOAD_FAIL" });
    }
  };

  //=====================
  //SELLER PROFILE PICTURE
  //======================
  const uploadSellerFileHandler = async (e) => {
    const file = e.target.files[0];
    const bodyFormData = new FormData();
    bodyFormData.append("file", file);
    try {
      dispatch({ type: "UPLOAD_REQUEST" });
      const { data } = await axios.post(`${request}/api/upload`, bodyFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
          authorization: `Bearer ${userInfo.token}`,
        },
      });
      dispatch({ type: "UPLOAD_SUCCESS" });
      toast.success("Image uploaded successfully", {
        position: "bottom-center",
      });
      setSellerLogo(data.secure_url);
    } catch (err) {
      toast.error(getError(err), { position: "bottom-center" });
      dispatch({ type: "UPLOAD_FAIL" });
    }
  };

  //=================
  //VERIFICATION HANDLER
  //=================
  const verificationHandler = async () => {
    // dispatch({ type: "CREATE_REQUEST" });
    try {
      const { data } = await axios.post(
        `${request}/api/users/verification-token`,
        {},
        {
          headers: { authorization: `Bearer ${userInfo.token}` },
        }
      );
      dispatch({ type: "CREATE_SUCCESS" });
      toast.success("Verification email sent successfully ", {
        position: "bottom-center",
      });
    } catch (err) {
      dispatch({ type: "CREATE_FAIL" });
      toast.error(getError(err), { position: "bottom-center" });
    }
  };

  console.log(user);
  return (
    <div className="mtb user_profile_page">
      <div className="container ">
        <div className="profile box_shadow">
          <Helmet>
            <title>Profile</title>
          </Helmet>
          <>
            {loading ? (
              <LoadingBox></LoadingBox>
            ) : error ? (
              <MessageBox variant="danger">{error}</MessageBox>
            ) : (
              <>
                <div className="profile">
                  <div className="profile-styles">
                    <div className="profile_seller">
                      <div className="profile_box">
                        <div className="profile-box">
                          <form
                            onSubmit={submitHandler}
                            className="profile_form"
                          >
                            <div className="profile-form-header d_flex">
                              <div className="form_header light_shadow a_flex">
                                <div className="user_image">
                                  <img src={image ? image : me} alt="" />
                                  <input
                                    className="profile-input-box"
                                    id="file"
                                    type="file"
                                    onChange={uploadFileHandler}
                                    style={{ display: "none" }}
                                  />
                                  <label htmlFor="file">
                                    <PublishIcon
                                      className="userUpdateIcon upload-btn "
                                      onChange={uploadFileHandler}
                                    />
                                  </label>
                                </div>
                                <div className="user_details">
                                  <div className="user_detail_list a_flex">
                                    <label>Name:</label>
                                    <h4>
                                      {user?.lastName}&#160;{user?.firstName}
                                    </h4>
                                  </div>
                                  <div className="user_detail_list a_flex">
                                    <label>Email:</label>
                                    <h4>{user?.email}</h4>
                                  </div>
                                  <div className="user_detail_list a_flex">
                                    <label>Address:</label>
                                    <h4>{user?.address}</h4>
                                  </div>
                                  <div className="user_detail_list a_flex">
                                    <label>Country:</label>
                                    <h4>{user?.country}</h4>
                                  </div>
                                  <div className="user_detail_list a_flex">
                                    <label>Application Status:</label>
                                    {user?.apply[0]?.status === "declined" ? (
                                      <span className="unverified_account a_flex">
                                        declined
                                      </span>
                                    ) : user?.apply[0]?.status ===
                                      "approved" ? (
                                      <span className="verified_account a_flex">
                                        approved
                                      </span>
                                    ) : user?.apply[0]?.status === "pending" ? (
                                      <span>pending</span>
                                    ) : (
                                      ""
                                    )}
                                  </div>
                                  <div className="user_detail_list a_flex">
                                    <label>Account Status:</label>
                                    {!user.isAccountVerified ? (
                                      <span className="unverified_account a_flex">
                                        unverified account
                                      </span>
                                    ) : (
                                      <span className="verified_account a_flex">
                                        verified account
                                      </span>
                                    )}
                                  </div>

                                  {!user.isAccountVerified ? (
                                    <div className="verify_now">
                                      <span onClick={verificationHandler}>
                                        Verify Now
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className="prof-seller-logo light_shadow">
                                <label className="seller_header">
                                  Profile Info:
                                </label>
                                <div className="profile-form-group">
                                  <input
                                    className="profile-input-box"
                                    id="sellerlogo"
                                    type="file"
                                    onChange={uploadSellerFileHandler}
                                    style={{ display: "none" }}
                                  />
                                  <div className="seller_flex ">
                                    <img
                                      src={sellerLogo ? sellerLogo : photo}
                                      alt=""
                                    />
                                    <label htmlFor="sellerlogo">
                                      <PublishIcon
                                        className="userUpdateIcon upload_vendor upload-btn"
                                        onChange={uploadSellerFileHandler}
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="profile_inner_form light_shadow">
                              {userInfo.isSeller && (
                                <>
                                  <div className="seller_component">
                                    <div className="profile-form-group seller_name">
                                      <label htmlFor="sellername">
                                        Merchant Name:{" "}
                                      </label>
                                      <input
                                        className="profile-input-box"
                                        id="sellername"
                                        type="text"
                                        placeholder="Seller Name"
                                        value={sellerName}
                                        onChange={(e) =>
                                          setSellerName(e.target.value)
                                        }
                                      />
                                    </div>
                                    <div className="profile-form-group">
                                      <label htmlFor="sellerdesc">About:</label>
                                      <div className="form_box">
                                        <JoditEditor
                                          className="editor"
                                          id="desc"
                                          ref={editor}
                                          value={sellerDescription}
                                          tabIndex={1}
                                          onBlur={(newContent) =>
                                            setSellerDescription(newContent)
                                          }
                                          onChange={(newContent) => {}}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                              <div className="profile_form_button">
                                <button>Update Profile</button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        </div>
      </div>
    </div>
  );
}

export default Vendor;
