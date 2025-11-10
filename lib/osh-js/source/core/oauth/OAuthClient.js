class OAuthClient {
  constructor(config) {
    if (!config) {
      throw new Error('BearerToken requires a config object')
    }

    this.config = config
    this.token = null
    this.expirationTime = 0
  }

  getToken() {
    return this.token
  }

  async refreshAccessToken() {
    const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    })

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data.toString(),
      })

      if (!response.ok) {
        console.error(`Failed to retrieve access token: ${response.status}`)
        return
      }

      const json = await response.json()
      this.token = json.access_token
      this.expirationTime = Date.now() + json.expires_in * 1000
    } catch (error) {
      console.error(`Failed to retrieve access token due to exception: ${error.message}`)
    }
  }

  isExpired() {
    return Date.now() > this.expirationTime
  }
}

// Singleton instance holder
let bearerTokenInstance = null
let oAuthConfigured = false;
let doOnce = true;

function checkOAuthConfigured() {

  if (!import.meta.env.VITE_CLIENT_ID || !import.meta.env.VITE_CLIENT_SECRET || !import.meta.env.VITE_TOKEN_ENDPOINT) {
    console.warn('OAuth not configured!')
  } else {
    oAuthConfigured = true;
  }
  doOnce = false;
}

function createOAuthClient(config) {

  if (!bearerTokenInstance) {
    bearerTokenInstance = new OAuthClient(config)
    oAuthConfigured = true;
  }
  return bearerTokenInstance
}

export function getOAuthClient() {

  if (doOnce) {
    checkOAuthConfigured();
  }
  // Send access grant information if it is defined
  if (oAuthConfigured && bearerTokenInstance === null) {
    createOAuthClient({
      clientId: import.meta.env.VITE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_CLIENT_SECRET,
      tokenEndpoint: import.meta.env.VITE_TOKEN_ENDPOINT,
    })
  }

  return bearerTokenInstance
}
