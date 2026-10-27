const API_BASE = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? `http://${window.location.hostname}:5000/api` : '/api');

function getHeaders(isFormData = false) {
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('sena_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(login, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ login, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
    return data;
  },

  async demoLogin(userId) {
    const res = await fetch(`${API_BASE}/auth/demo/${userId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al conectar usuario de prueba');
    return data;
  },

  async adminQuickLogin() {
    const res = await fetch(`${API_BASE}/auth/admin-quick-login`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar como Administrador');
    return data;
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en el registro');
    return data;
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al obtener usuario actual');
    return data;
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders()
      });
    } catch (e) {
      console.warn('Logout request warning:', e);
    }
  },

  async heartbeat() {
    try {
      await fetch(`${API_BASE}/auth/heartbeat`, {
        method: 'POST',
        headers: getHeaders()
      });
    } catch (e) {}
  },

  // Users
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/users${query ? '?' + query : ''}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getUserById(id) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Usuario no encontrado');
    return data;
  },

  async updateProfile(id, profileData) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar perfil');
    return data;
  },

  async updateInterests(id, interestsData) {
    const res = await fetch(`${API_BASE}/users/${id}/interests`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(interestsData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar intereses');
    return data;
  },

  async updateSettings(id, settingsData) {
    const res = await fetch(`${API_BASE}/users/${id}/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settingsData)
    });
    return res.json();
  },

  // Posts
  async getPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/posts${query ? '?' + query : ''}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async createPost(postData) {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(postData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear publicación');
    return data;
  },

  async deletePost(id) {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  async reactToPost(id, reaction_type = 'like') {
    const res = await fetch(`${API_BASE}/posts/${id}/react`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reaction_type })
    });
    return res.json();
  },

  async addComment(postId, content) {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al comentar');
    return data;
  },

  // Friends
  async getFriends() {
    const res = await fetch(`${API_BASE}/friends`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getFriendRequests() {
    const res = await fetch(`${API_BASE}/friends/requests`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async addFriend(userId) {
    const res = await fetch(`${API_BASE}/friends/request/${userId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  async removeFriend(userId) {
    const res = await fetch(`${API_BASE}/friends/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Groups
  async getGroups(category) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_BASE}/groups${query}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getGroupById(id) {
    const res = await fetch(`${API_BASE}/groups/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async createGroup(groupData) {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(groupData)
    });
    return res.json();
  },

  async joinGroup(id) {
    const res = await fetch(`${API_BASE}/groups/${id}/join`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  async leaveGroup(id) {
    const res = await fetch(`${API_BASE}/groups/${id}/leave`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Messages
  async getConversations() {
    const res = await fetch(`${API_BASE}/messages/conversations`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getChat(targetId) {
    const res = await fetch(`${API_BASE}/messages/${targetId}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async sendMessage(targetId, message) {
    const res = await fetch(`${API_BASE}/messages/${targetId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message })
    });
    return res.json();
  },

  // Events
  async getEvents(category) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_BASE}/events${query}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async toggleEventAttendance(id, status = 'going') {
    const res = await fetch(`${API_BASE}/events/${id}/attend`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async createEvent(eventData) {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(eventData)
    });
    return res.json();
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async markNotificationsRead() {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return res.json();
  },

  // File Upload
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return res.json();
  },

  // Super Admin Management
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al obtener estadísticas de administración');
    return data;
  },

  async getAdminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/users${query ? '?' + query : ''}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al listar usuarios');
    return data;
  },

  async createAdminUser(userData) {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear usuario');
    return data;
  },

  async updateAdminUser(id, userData) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar usuario');
    return data;
  },

  async toggleUserStatus(id, status) {
    const res = await fetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cambiar estado');
    return data;
  },

  async resetUserPassword(id, newPassword) {
    const res = await fetch(`${API_BASE}/admin/users/${id}/reset-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ new_password: newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al restablecer contraseña');
    return data;
  },

  async deleteUser(id) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');
    return data;
  },

  async getAdminPosts() {
    const res = await fetch(`${API_BASE}/admin/posts`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getSupabaseStatus() {
    const res = await fetch(`${API_BASE}/supabase-status`);
    return res.json();
  },

  async syncSupabase() {
    const res = await fetch(`${API_BASE}/admin/sync-supabase`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al sincronizar con Supabase');
    return data;
  }
};
