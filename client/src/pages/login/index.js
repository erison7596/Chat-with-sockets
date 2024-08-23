import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { LoginUser } from "../../apicalls/users";
import { HideLoader, ShowLoader } from "../../redux/loaderSlice";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [user, setUser] = React.useState({
    email: "",
    password: "",
  });

  const login = async () => {
    try {
      dispatch(ShowLoader());
      const response = await LoginUser(user);
      dispatch(HideLoader());
      if (response.success) {
        toast.success("Usuário logado com sucesso");
        localStorage.setItem("token", response.data);
        window.location.href = "/";
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoader());
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/");
    }
  }, []);

  return (
    <div
      className="h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #00510f 0%, #0f7527 100%)",
      }}
    >
      <div className="bg-white shadow-lg rounded-lg p-8 flex flex-col gap-6 w-full max-w-sm">
        <div className="flex items-center gap-3">
          <img src="/iflogo.png" alt="logo" className="w-12 h-12" />
          <h1 className="text-3xl font-bold text-[#00510f] tracking-wide">
            IFchat Login
          </h1>
        </div>
        <hr className="border-gray-200" />

        <input
          type="text"
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          placeholder="Digite seu email"
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f7527]"
        />
        <input
          type="password"
          value={user.password}
          onChange={(e) => setUser({ ...user, password: e.target.value })}
          placeholder="Digite sua senha"
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f7527]"
        />

        <button
          className={`${
            user.email && user.password
              ? "bg-[#0f7527] text-white"
              : "bg-gray-300 text-gray-500"
          } p-3 rounded-md font-semibold transition-all duration-300`}
          onClick={login}
          disabled={!user.email || !user.password}
        >
          LOGIN
        </button>

        <Link to="/register" className="text-[#0f7527] text-sm underline text-center">
          Não tem conta? Cria aqui, besta
        </Link>
      </div>
    </div>
  );
}

export default Login;
