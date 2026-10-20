import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function AdminView() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Password reset modal
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Notification message
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Create Form State
  const [createForm, setCreateForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'aprendiz',
    status: 'active',
    program: 'Análisis y Desarrollo de Software (ADSO)',
    ficha: 'Ficha 2670142',
    occupation: 'Aprendiz SENA',
    origin_city: 'Espinal, Tolima',
    phone: '+57 320 000 0000'
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    email: '',
    role: 'aprendiz',
    status: 'active',
    program: '',
    ficha: '',
    occupation: '',
    origin_city: '',
    phone: ''
  });

  useEffect(() => {
    loadAdminData();
  }, [roleFilter, statusFilter]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers({
          role: roleFilter,
          status: statusFilter,
          search: searchTerm
        })
      ]);
      setStats(statsData);
      setUsers(usersData || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al cargar datos de administración');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    loadAdminData();
  }

  async function handleCreateUserSubmit(e) {
    e.preventDefault();
    try {
      await api.createAdminUser(createForm);
      setShowCreateModal(false);
      setCreateForm({
        full_name: '',
        username: '',
        email: '',
        password: '',
        role: 'aprendiz',
        status: 'active',
        program: 'Análisis y Desarrollo de Software (ADSO)',
        ficha: 'Ficha 2670142',
        occupation: 'Aprendiz SENA',
        origin_city: 'Espinal, Tolima',
        phone: '+57 320 000 0000'
      });
      setActionMsg('¡Usuario registrado exitosamente en MySQL!');
      setTimeout(() => setActionMsg(''), 4000);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Error al crear usuario');
    }
  }

  function openEditModal(user) {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'aprendiz',
      status: user.status || 'active',
      program: user.program || '',
      ficha: user.ficha || '',
      occupation: user.occupation || '',
      origin_city: user.origin_city || '',
      phone: user.phone || ''
    });
    setShowEditModal(true);
  }

  async function handleEditUserSubmit(e) {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.updateAdminUser(selectedUser.id, editForm);
      setShowEditModal(false);
      setActionMsg(`¡Cuenta de ${editForm.full_name} actualizada correctamente!`);
      setTimeout(() => setActionMsg(''), 4000);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Error al actualizar usuario');
    }
  }

  async function handleToggleStatus(user) {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const actionText = nextStatus === 'suspended' ? 'suspender' : 'reactivar';

    if (!window.confirm(`¿Confirmas que deseas ${actionText} la cuenta de ${user.full_name}?`)) {
      return;
    }

    try {
      await api.toggleUserStatus(user.id, nextStatus);
      setActionMsg(`Cuenta de ${user.full_name} ${nextStatus === 'suspended' ? 'suspendida' : 'reactivada'}.`);
      setTimeout(() => setActionMsg(''), 4000);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Error al cambiar estado');
    }
  }

  function openResetPasswordModal(user) {
    setSelectedUser(user);
    setNewPassword('');
    setShowResetPassModal(true);
  }

  async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    try {
      await api.resetUserPassword(selectedUser.id, newPassword);
      setShowResetPassModal(false);
      setActionMsg(`Contraseña restablecida para ${selectedUser.full_name}.`);
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Error al restablecer contraseña');
    }
  }

  async function handleDeleteUser(user) {
    if (user.id === currentUser?.id) {
      alert('No puedes eliminar tu propia cuenta de Administrador.');
      return;
    }

    if (!window.confirm(`⚠️ ACCIÓN DESTRUCTIVA: ¿Estás seguro de eliminar permanentemente la cuenta de ${user.full_name} (@${user.username}) y todos sus datos en MySQL?`)) {
      return;
    }

    try {
      await api.deleteUser(user.id);
      setActionMsg(`Cuenta de ${user.full_name} eliminada permanentemente.`);
      setTimeout(() => setActionMsg(''), 4000);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Error al eliminar usuario');
    }
  }

  return (
    <div className="content-wrapper">
      {/* Header Banner */}
      <div
        className="sena-card mb-4"
        style={{
          background: 'linear-gradient(135deg, #074C83 0%, #032b4b 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="bg-warning text-dark p-3 rounded-circle shadow d-flex align-items-center justify-content-center"
              style={{ width: 60, height: 60 }}
            >
              <i className="bi bi-shield-lock-fill fs-2"></i>
            </div>
            <div>
              <div className="badge bg-warning text-dark fw-bold mb-1 px-3 py-1 text-uppercase">
                <i className="bi bi-star-fill me-1"></i>Super Administrador Maestro
              </div>
              <h3 className="fw-bold mb-0">Panel de Control & Gestión de Cuentas SENA</h3>
              <div className="small text-light opacity-75">
                Sesión activa como: <strong>{currentUser?.full_name}</strong> (@{currentUser?.username})
              </div>
            </div>
          </div>

          <button
            className="btn btn-warning text-dark fw-bold shadow-sm d-flex align-items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-person-plus-fill fs-5"></i>
            Crear Nuevo Usuario / Aprendiz
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-4 shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill fs-5"></i>
          <div>{actionMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>{errorMsg}</div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="sena-card p-3 mb-0 h-100 border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-bold text-uppercase">Total Usuarios</div>
                <h3 className="fw-bold mb-0 text-dark">{stats?.total_users || 0}</h3>
              </div>
              <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                <i className="bi bi-people-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="sena-card p-3 mb-0 h-100 border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-bold text-uppercase">Cuentas Activas</div>
                <h3 className="fw-bold mb-0 text-success">{stats?.active_users || 0}</h3>
              </div>
              <div className="bg-success-subtle text-success p-3 rounded-circle">
                <i className="bi bi-person-check-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="sena-card p-3 mb-0 h-100 border-start border-4 border-danger">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-bold text-uppercase">Suspendidas</div>
                <h3 className="fw-bold mb-0 text-danger">{stats?.suspended_users || 0}</h3>
              </div>
              <div className="bg-danger-subtle text-danger p-3 rounded-circle">
                <i className="bi bi-person-x-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="sena-card p-3 mb-0 h-100 border-start border-4 border-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-bold text-uppercase">Publicaciones</div>
                <h3 className="fw-bold mb-0 text-dark">{stats?.total_posts || 0}</h3>
              </div>
              <div className="bg-info-subtle text-info p-3 rounded-circle">
                <i className="bi bi-chat-quote-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="sena-card p-3 mb-4">
        <form onSubmit={handleSearch} className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, usuario, correo, ficha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Todos los Roles</option>
              <option value="aprendiz">Aprendices</option>
              <option value="instructor">Instructores</option>
              <option value="superadmin">Super Administradores</option>
            </select>
          </div>

          <div className="col-md-2">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
            </select>
          </div>

          <div className="col-md-2">
            <button type="submit" className="sena-btn-primary w-100">
              <i className="bi bi-funnel-fill me-1"></i> Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Users Management Table */}
      <div className="sena-card p-0 overflow-hidden shadow-sm">
        <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold text-dark">
            <i className="bi bi-table me-2 text-primary"></i>Lista de Usuarios Registrados en el Sistema
          </h5>
          <span className="badge bg-secondary">{users.length} cuentas encontradas</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr className="small text-muted text-uppercase">
                <th className="ps-4">Usuario / Aprendiz</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Programa & Ficha</th>
                <th>Contacto</th>
                <th className="text-end pe-4">Acciones de Super Admin</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                    Cargando cuentas registradas...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No se encontraron cuentas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isSuspended = u.status === 'suspended';

                  return (
                    <tr key={u.id} className={isSuspended ? 'table-danger bg-opacity-10' : ''}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={u.avatar_url || '/assets/juan_pablo_avatar.jpg'}
                            alt=""
                            className="rounded-circle shadow-sm"
                            style={{ width: 44, height: 44, objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-bold text-dark">
                              {u.full_name}
                              {isCurrent && (
                                <span className="badge bg-primary ms-2" style={{ fontSize: '0.7rem' }}>
                                  Tú (Admin)
                                </span>
                              )}
                            </div>
                            <div className="text-muted small">@{u.username} · ID #{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${u.role === 'superadmin' ? 'bg-warning text-dark fw-bold' : u.role === 'instructor' ? 'bg-info text-dark' : 'bg-primary-subtle text-primary'}`}>
                          {u.role === 'superadmin' ? '🛡️ Super Admin' : u.role === 'instructor' ? '👨‍🏫 Instructor' : '🎓 Aprendiz'}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${isSuspended ? 'bg-danger' : 'bg-success'}`}>
                          <i className={`bi ${isSuspended ? 'bi-x-circle-fill' : 'bi-check-circle-fill'} me-1`}></i>
                          {isSuspended ? 'Suspendido' : 'Activo'}
                        </span>
                      </td>

                      <td>
                        <div className="small fw-semibold text-dark text-truncate" style={{ maxWidth: 220 }}>
                          {u.program || 'No especificado'}
                        </div>
                        <div className="text-muted small">{u.ficha || 'Sin ficha'}</div>
                      </td>

                      <td>
                        <div className="small text-dark">{u.email}</div>
                        <div className="text-muted small">{u.phone || 'Sin teléfono'}</div>
                      </td>

                      <td className="text-end pe-4">
                        <div className="btn-group btn-group-sm">
                          {/* Edit button */}
                          <button
                            className="btn btn-outline-primary"
                            title="Editar cuenta"
                            onClick={() => openEditModal(u)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>

                          {/* Reset password button */}
                          <button
                            className="btn btn-outline-warning text-dark"
                            title="Resetear contraseña"
                            onClick={() => openResetPasswordModal(u)}
                          >
                            <i className="bi bi-key-fill"></i>
                          </button>

                          {/* Toggle status button */}
                          {!isCurrent && (
                            <button
                              className={`btn ${isSuspended ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                              title={isSuspended ? 'Reactivar cuenta' : 'Suspender cuenta'}
                              onClick={() => handleToggleStatus(u)}
                            >
                              <i className={`bi ${isSuspended ? 'bi-unlock-fill' : 'bi-slash-circle-fill'}`}></i>
                            </button>
                          )}

                          {/* Delete button */}
                          {!isCurrent && (
                            <button
                              className="btn btn-outline-danger"
                              title="Eliminar cuenta permanentemente"
                              onClick={() => handleDeleteUser(u)}
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREAR NUEVO USUARIO / APRENDIZ */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold" style={{ color: '#0b3b60' }}>
                  <i className="bi bi-person-plus-fill me-2 text-primary"></i>Registrar Nuevo Usuario / Aprendiz
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>

              <form onSubmit={handleCreateUserSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Nombre Completo:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. Valentina Morales Gómez"
                        value={createForm.full_name}
                        onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Nombre de Usuario (@):</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="valentinam"
                        value={createForm.username}
                        onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Correo Electrónico:</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="vmorales@sena.edu.co"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Contraseña Inicial:</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Mínimo 6 caracteres"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold small">Rol en el SENA:</label>
                      <select
                        className="form-select"
                        value={createForm.role}
                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      >
                        <option value="aprendiz">Aprendiz</option>
                        <option value="instructor">Instructor</option>
                        <option value="superadmin">Super Administrador</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold small">Estado de la Cuenta:</label>
                      <select
                        className="form-select"
                        value={createForm.status}
                        onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                      >
                        <option value="active">Activo</option>
                        <option value="suspended">Suspendido</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold small">Número de Ficha:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ficha 2670142"
                        value={createForm.ficha}
                        onChange={(e) => setCreateForm({ ...createForm, ficha: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Programa de Formación:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Análisis y Desarrollo de Software"
                        value={createForm.program}
                        onChange={(e) => setCreateForm({ ...createForm, program: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Ciudad de Origen:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Espinal, Tolima"
                        value={createForm.origin_city}
                        onChange={(e) => setCreateForm({ ...createForm, origin_city: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                  <button type="submit" className="sena-btn-primary">Registrar en Base de Datos</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUARIO */}
      {showEditModal && selectedUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold" style={{ color: '#0b3b60' }}>
                  <i className="bi bi-pencil-square me-2 text-primary"></i>Editar Cuenta: {selectedUser.full_name}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>

              <form onSubmit={handleEditUserSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Nombre Completo:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Nombre de Usuario (@):</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Correo Electrónico:</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-bold small">Rol:</label>
                      <select
                        className="form-select"
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      >
                        <option value="aprendiz">Aprendiz</option>
                        <option value="instructor">Instructor</option>
                        <option value="superadmin">Super Administrador</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-bold small">Estado:</label>
                      <select
                        className="form-select"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      >
                        <option value="active">Activo</option>
                        <option value="suspended">Suspendido</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Programa de Formación:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.program}
                        onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Número de Ficha:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.ficha}
                        onChange={(e) => setEditForm({ ...editForm, ficha: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Ciudad de Origen:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.origin_city}
                        onChange={(e) => setEditForm({ ...editForm, origin_city: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Teléfono:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)}>Cancelar</button>
                  <button type="submit" className="sena-btn-primary">Guardar Cambios</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESETEAR CONTRASEÑA */}
      {showResetPassModal && selectedUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold" style={{ color: '#0b3b60' }}>
                  <i className="bi bi-key-fill me-2 text-warning"></i>Resetear Contraseña
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowResetPassModal(false)}></button>
              </div>

              <form onSubmit={handleResetPasswordSubmit}>
                <div className="modal-body p-4">
                  <p className="text-secondary small mb-3">
                    Establecer nueva contraseña cifrada para el usuario <strong>{selectedUser.full_name}</strong> (@{selectedUser.username}).
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Nueva Contraseña:</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light" onClick={() => setShowResetPassModal(false)}>Cancelar</button>
                  <button type="submit" className="sena-btn-primary">Actualizar Clave</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
