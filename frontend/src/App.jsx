import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProfileView from './components/ProfileView';
import FeedView from './components/FeedView';
import FriendsView from './components/FriendsView';
import GroupsView from './components/GroupsView';
import MessagesView from './components/MessagesView';
import EventsView from './components/EventsView';
import SettingsView from './components/SettingsView';
import AdminView from './components/AdminView';
import RightChatSidebar from './components/RightChatSidebar';
import FloatingMiniChat from './components/FloatingMiniChat';
import EditProfileModal from './components/EditProfileModal';
import AuthModal from './components/AuthModal';
import DataPrivacyNotice from './components/DataPrivacyNotice';
import DataPolicyModal from './components/DataPolicyModal';

function MainApp() {
  const { authModalOpen, setAuthModalOpen } = useAuth();
  const { t, setDataPolicyModalOpen } = useLanguage();
  const [currentView, setCurrentView] = useState('inicio'); // Facebook-style default to News Feed
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeChatUserId, setActiveChatUserId] = useState(null);
  const [miniChatContact, setMiniChatContact] = useState(null);

  function handleSelectUserChat(userId) {
    setActiveChatUserId(userId);
    setCurrentView('mensajes');
  }

  function handleOpenMiniChat(contact) {
    setMiniChatContact(contact);
  }

  return (
    <div className="app-container">
      {/* 1. Left Sidebar Navigation (Facebook-style Navigation) */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        unreadMessagesCount={2}
      />

      {/* 2. Main Viewport */}
      <div className="app-main">
        {/* Top Header Bar */}
        <Navbar
          setCurrentView={setCurrentView}
          onSearch={(query) => {
            if (query && currentView !== 'amigos' && currentView !== 'inicio') {
              setCurrentView('amigos');
            }
          }}
        />

        {/* 3-Column Body Layout (Center Feed + Right Chat Sidebar) */}
        <div className="app-body-layout">
          {/* Center Dynamic Content Column */}
          <main className="app-center-content">
            {currentView === 'inicio' && (
              <FeedView setCurrentView={setCurrentView} />
            )}

            {currentView === 'perfil' && (
              <ProfileView onOpenEditModal={() => setEditModalOpen(true)} />
            )}

            {currentView === 'amigos' && (
              <FriendsView
                onSelectUserChat={handleSelectUserChat}
                onViewProfile={() => setCurrentView('perfil')}
              />
            )}

            {currentView === 'grupos' && (
              <GroupsView />
            )}

            {currentView === 'mensajes' && (
              <MessagesView
                initialTargetUserId={activeChatUserId}
                onClearTargetUser={() => setActiveChatUserId(null)}
              />
            )}

            {currentView === 'eventos' && (
              <EventsView />
            )}

            {currentView === 'admin' && (
              <AdminView />
            )}

            {currentView === 'configuracion' && (
              <SettingsView />
            )}
          </main>

          {/* Right Sidebar: Facebook-style Contacts & Instant Chats Dock */}
          {currentView !== 'mensajes' && (
            <RightChatSidebar
              onOpenMiniChat={handleOpenMiniChat}
              onViewFullMessages={() => setCurrentView('mensajes')}
            />
          )}
        </div>

        {/* Global Footer */}
        <footer className="text-center py-3 text-muted small border-top bg-white mt-auto">
          <div className="container-fluid d-flex flex-wrap justify-content-between align-items-center px-4 gap-2">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="text-muted">{t('nav.allRights')}</span>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-primary text-decoration-none d-flex align-items-center gap-1"
                onClick={() => setDataPolicyModalOpen(true)}
              >
                <i className="bi bi-shield-check"></i>
                <span className="fw-semibold">{t('nav.privacyBannerBtn')}</span>
              </button>
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-code-slash text-success fs-6"></i>
              <span>{t('nav.developedBy')} <strong className="text-dark">Juan Pablo Tocarema Ávila</strong></span>
              <span className="badge bg-success-subtle text-success border border-success-subtle ms-1">{t('nav.adsoFicha')}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Messenger Mini Chat Window (Docked on bottom right) */}
      {miniChatContact && (
        <FloatingMiniChat
          contact={miniChatContact}
          onClose={() => setMiniChatContact(null)}
          onExpandFull={(userId) => {
            handleSelectUserChat(userId);
            setMiniChatContact(null);
          }}
        />
      )}

      {/* Profile Edit Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />

      {/* Authentication Modal (Login / Register real accounts) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Floating Data Privacy & Law 1581 (Habeas Data) Banner */}
      <DataPrivacyNotice />

      {/* Legal Data Protection Policy Modal (Law 1581 of 2012) */}
      <DataPolicyModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
