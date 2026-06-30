import axios from "axios";

export async function logout() {
  const token = localStorage.getItem("token");

  try {
    await axios.post(
      "http://localhost:3000/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );
  } catch (e) {
    // mesmo se backend falhar, limpamos localmente
    console.error(e);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
}