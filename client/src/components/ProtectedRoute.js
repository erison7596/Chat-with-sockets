import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { GetAllChats } from "../apicalls/chats";
import { GetAllUsers, GetCurrentUser } from "../apicalls/users";
import { HideLoader, ShowLoader } from "../redux/loaderSlice";
import { SetAllUsers, SetUser, SetAllChats } from "../redux/userSlice";

function ProtectedRoute({ children }) {
  const { user } = useSelector((state) => state.userReducer);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getCurrentUser = async () => {
    try {
      dispatch(ShowLoader());
      const response = await GetCurrentUser();
      const allUsersResponse = await GetAllUsers();
      const allChatsResponse = await GetAllChats();
      dispatch(HideLoader());
      if (response.success) {
        dispatch(SetUser(response.data));
        dispatch(SetAllUsers(allUsersResponse.data));
        dispatch(SetAllChats(allChatsResponse.data));
      } else {
        toast.error(response.message);
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (error) {
      dispatch(HideLoader());
      toast.error(error.message);
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      getCurrentUser();
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-100">
      {/* Header */}
      <header className="flex justify-between items-center bg-[#00510f] p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/iflogo.png" alt="logo" className="w-12 h-12" />
          <h1
            className="text-white text-3xl font-bold uppercase tracking-wider cursor-pointer"
            onClick={() => {
              navigate("/");
            }}
          >
            IFCHAT
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt="profile"
              className="h-10 w-10 rounded-full object-cover border-2 border-[#00510f]"
            />
          ) : (
            <i className="ri-shield-user-line text-2xl text-[#00510f]"></i>
          )}
          <h1
            className="text-[#00510f] font-medium cursor-pointer hover:underline"
            onClick={() => {
              navigate("/profile");
            }}
          >
            {user?.name}
          </h1>
          <i
            className="ri-logout-circle-r-line text-2xl text-[#00510f] cursor-pointer hover:text-red-600 transition"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
          ></i>
        </div>
      </header>

      {/* Content (Pages) */}
      <main className="p-5 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default ProtectedRoute;
