export const setToken = (token) => localStorage.setItem("access_token", token);
export const getToken = () => localStorage.getItem("access_token");
export const isAuthenticated = () => !!localStorage.getItem("access_token");

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_email");
  localStorage.removeItem("first_name");
  localStorage.removeItem("last_name");
  localStorage.removeItem("photo_url");
  window.location.href = "/login";
};