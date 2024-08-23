import moment from "moment";
import 'moment/locale/pt-br'; // Importa a localidade em português do Brasil
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { HideLoader, ShowLoader } from "../../redux/loaderSlice";
import { SetUser } from "../../redux/userSlice";
import { UpdateProfilePicture } from "../../apicalls/users";

function Profile() {
  const { user } = useSelector((state) => state.userReducer);
  const [image, setImage] = React.useState("");
  const dispatch = useDispatch();

  const onFileSelect = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader(file);
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      setImage(reader.result);
    };
  };

  useEffect(() => {
    if (user?.profilePic) {
      setImage(user.profilePic);
    }
  }, [user]);

  const updateProfilePic = async () => {
    try {
      dispatch(ShowLoader());
      const response = await UpdateProfilePicture(image);
      dispatch(HideLoader());
      if (response.success) {
        toast.success("Imagem de perfil atualizada");
        dispatch(SetUser(response.data));
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      dispatch(HideLoader());
      toast.error(error.message);
    }
  };

  // Configura o moment para usar a localidade em português
  moment.locale('pt-br');

  return (
    user && (
      <div className="flex items-center justify-center h-[80vh] bg-gray-100">
        <div className="bg-white text-center p-6 shadow-lg rounded-lg max-w-md w-full">
          <div className="mb-4">
            {image ? (
              <img
                src={image}
                alt="profile pic"
                className="w-32 h-32 rounded-full mx-auto border-4 border-green-500 shadow-sm"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto bg-gray-300 border-4 border-green-500 shadow-sm"></div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-700">{user.name}</h1>
          <h2 className="text-gray-500 mb-4">{user.email}</h2>
          <p className="text-sm text-gray-400 mb-4">
            Criado em: {moment(user.createdAt).format("LLL")}
          </p>

          <div className="flex flex-col items-center gap-4">
            <label
              htmlFor="file-input"
              className="bg-green-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-green-600 transition-all"
            >
              Selecionar foto
            </label>
            <input
              type="file"
              onChange={onFileSelect}
              className="hidden"
              id="file-input"
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all"
              onClick={updateProfilePic}
              disabled={!image}
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>
    )
  );
}

export default Profile;
