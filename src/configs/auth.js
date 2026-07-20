export default {
  meEndpoint: '/auth/me',
  loginEndpoint: '/jwt/login',
  registerEndpoint: '/auth/signup',
  storageTokenKeyName: 'accessToken',
  storageRefreshKeyName: 'refreshToken',
  storageRememberKeyName: 'rememberMe',
  /** Refresh endpoint — POST { refresh_token } */
  refreshEndpoint: '/auth/refresh',
  onTokenExpiration: 'refreshToken'
}
