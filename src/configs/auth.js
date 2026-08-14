export default {
  meEndpoint: '/user/me',
  loginEndpoint: '/auth/login',
  registerEndpoint: '/auth/signup',
  logoutEndpoint: '/auth/logout',
  storageTokenKeyName: 'accessToken',
  storageRefreshKeyName: 'refreshToken',
  storageRememberKeyName: 'rememberMe',
  refreshEndpoint: '/auth/refresh',
  onTokenExpiration: 'refreshToken'
}
