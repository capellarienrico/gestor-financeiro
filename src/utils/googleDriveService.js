/**
 * Google Drive Sync Service
 * Integrates Google Identity Services (GIS) and Google Drive API v3
 */

export const GOOGLE_CLIENT_ID = '1034124968812-8tvb66turl48u0msk1jq26crs981s0h2.apps.googleusercontent.com'
export const DRIVE_FILENAME = 'gestor-financeiro-data.json'
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'

const TOKEN_KEY = 'gdrive_auth_token'
const EXPIRES_KEY = 'gdrive_token_expires'
const USER_KEY = 'gdrive_user_profile'
const FILE_ID_KEY = 'gdrive_file_id'
const LAST_SYNC_KEY = 'gdrive_last_sync'

let tokenClient = null

/**
 * Initializes the OAuth token client using Google Identity Services
 */
export function initGoogleTokenClient(onSuccess, onError) {
  if (typeof window === 'undefined' || !window.google || !window.google.accounts) {
    return false
  }

  try {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: async (response) => {
        if (response.error) {
          console.error('Google OAuth error:', response)
          if (onError) onError(response.error)
          return
        }

        const token = response.access_token
        const expiresIn = response.expires_in || 3599
        const expiresAt = Date.now() + (expiresIn - 60) * 1000

        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(EXPIRES_KEY, expiresAt.toString())

        try {
          const user = await fetchUserProfile(token)
          localStorage.setItem(USER_KEY, JSON.stringify(user))
          if (onSuccess) onSuccess({ token, user })
        } catch (err) {
          console.error('Erro ao buscar perfil:', err)
          if (onSuccess) onSuccess({ token, user: null })
        }
      }
    })
    return true
  } catch (err) {
    console.error('Erro ao inicializar token client Google:', err)
    return false
  }
}

/**
 * Requests login / OAuth token
 */
export function requestGoogleLogin() {
  return new Promise((resolve, reject) => {
    const initialized = initGoogleTokenClient(
      ({ token, user }) => resolve({ token, user }),
      (err) => reject(err)
    )

    if (!initialized || !tokenClient) {
      reject(new Error('Google Identity Services ainda não carregou. Verifique sua conexão.'))
      return
    }

    // Trigger OAuth consent popup
    tokenClient.requestAccessToken({ prompt: '' })
  })
}

/**
 * Fetches Google User Profile info (name, email, picture)
 */
export async function fetchUserProfile(token) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Falha ao obter perfil do usuário')
  return await res.json()
}

/**
 * Gets cached token if still valid
 */
export function getValidAccessToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  const expires = parseInt(localStorage.getItem(EXPIRES_KEY) || '0', 10)
  if (token && Date.now() < expires) {
    return token
  }
  return null
}

/**
 * Gets cached Google User
 */
export function getCachedGoogleUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Disconnects / Logouts from Google
 */
export function logoutGoogle() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(token, () => {})
  }
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRES_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(FILE_ID_KEY)
  localStorage.removeItem(LAST_SYNC_KEY)
}

/**
 * Searches for existing database file on Google Drive
 */
export async function findDriveFile(token) {
  const q = encodeURIComponent(`name = '${DRIVE_FILENAME}' and trashed = false`)
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&spaces=drive`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!res.ok) {
    throw new Error(`Erro ao buscar arquivo no Drive (${res.status})`)
  }

  const json = await res.json()
  if (json.files && json.files.length > 0) {
    const file = json.files[0]
    localStorage.setItem(FILE_ID_KEY, file.id)
    return file
  }
  return null
}

/**
 * Reads database file content from Google Drive
 */
export async function readDriveFileContent(token, fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!res.ok) {
    throw new Error(`Erro ao baixar arquivo do Drive (${res.status})`)
  }

  return await res.json()
}

/**
 * Creates new database file on Google Drive (multipart upload)
 */
export async function createDriveFile(token, data) {
  const boundary = '-------314159265358979323846'
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`

  const metadata = {
    name: DRIVE_FILENAME,
    mimeType: 'application/json',
    description: 'Banco de dados do Gestor Financeiro Pessoal'
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(data, null, 2) +
    closeDelimiter

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao criar arquivo no Drive (${res.status}): ${errText}`)
  }

  const file = await res.json()
  localStorage.setItem(FILE_ID_KEY, file.id)
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
  return file
}

/**
 * Updates existing database file on Google Drive
 */
export async function updateDriveFile(token, fileId, data) {
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data, null, 2)
  })

  if (!res.ok) {
    throw new Error(`Erro ao atualizar arquivo no Drive (${res.status})`)
  }

  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
  return await res.json()
}

/**
 * Full Sync Helper:
 * Checks if file exists; if not, creates it; if yes, uploads or merges data.
 */
export async function syncDataWithDrive(token, localData, options = { forceUpload: false }) {
  let fileId = localStorage.getItem(FILE_ID_KEY)

  if (!fileId) {
    const existing = await findDriveFile(token)
    if (existing) {
      fileId = existing.id
    }
  }

  // File doesn't exist yet -> Create it with local data
  if (!fileId) {
    const created = await createDriveFile(token, localData)
    return {
      action: 'created',
      fileId: created.id,
      data: localData,
      syncTime: new Date().toISOString()
    }
  }

  // If force upload is specified, overwrite remote
  if (options.forceUpload) {
    await updateDriveFile(token, fileId, localData)
    return {
      action: 'uploaded',
      fileId,
      data: localData,
      syncTime: new Date().toISOString()
    }
  }

  // Otherwise, if options.forceDownload, read from remote
  if (options.forceDownload) {
    const remoteData = await readDriveFileContent(token, fileId)
    return {
      action: 'downloaded',
      fileId,
      data: remoteData,
      syncTime: new Date().toISOString()
    }
  }

  // Default save/update
  await updateDriveFile(token, fileId, localData)
  return {
    action: 'updated',
    fileId,
    data: localData,
    syncTime: new Date().toISOString()
  }
}
