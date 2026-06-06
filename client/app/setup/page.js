"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import useAuthStore from "@/store/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BottomNav from "@/components/ui/BottomNav";
import MaterialIcon from "@/components/ui/MaterialIcon";
import useChatBackgroundStore, { BACKGROUNDS } from "@/store/chatBackgroundStore";
import "./profile.css";

function SettingsItem({ icon, title, subtitle, badge, danger, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`settings-item ${danger ? "danger" : ""}`}
    >
      <div className="settings-item-icon">
        <MaterialIcon
          name={icon}
          className={danger ? "settings-icon-danger" : "settings-icon"}
        />
      </div>
      <div className="settings-item-content">
        <p className={`settings-item-title ${danger ? "danger" : ""}`}>
          {title}
        </p>
        {subtitle && <p className="settings-item-subtitle">{subtitle}</p>}
      </div>
      {badge && (
        <div className="settings-item-badge">
          <span>{badge}</span>
        </div>
      )}
      {!danger && (
        <MaterialIcon name="chevron_right" className="settings-item-chevron" />
      )}
    </button>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <SetupContent />
    </ProtectedRoute>
  );
}

function SetupContent() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const { user, getMe, setUser, logout } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({ name: "", bio: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const chatBg = useChatBackgroundStore((s) => s.bg);
  const setChatBg = useChatBackgroundStore((s) => s.setBg);
  const customColor = useChatBackgroundStore((s) => s.customColor);
  const setCustomColor = useChatBackgroundStore((s) => s.setCustomColor);

  useEffect(() => {
    getMe();
  }, [getMe]);

  useEffect(() => {
    if (!user) return;

    setFormData({
      name: user.name || "",
      bio: user.bio || "",
    });
    setAvatarPreview(user.profilePic || null);

    if (!user.name && !user.bio && !user.profilePic) {
      setIsEditing(true);
    }
  }, [user]);

  const displayName = user?.name || user?.username || "Your Name";
  const displayBio =
    user?.bio || "Add a short bio so friends know more about you.";

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }

    setPendingAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      let profilePic = user?.profilePic || "";

      if (pendingAvatar) {
        try {
          const imageData = new FormData();
          imageData.append("image", pendingAvatar);
          const uploadRes = await axiosInstance.post(
            "/users/upload",
            imageData,
          );
          profilePic = uploadRes.data.url;
        } catch {
          profilePic = await readFileAsDataUrl(pendingAvatar);
        }
      }

      const res = await axiosInstance.patch("/users/setup", {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        profilePic,
      });

      setUser(res.data.user);
      setPendingAvatar(null);
      setIsEditing(false);
      setSuccess("Profile updated");
      router.push("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setFormData({ name: user.name || "", bio: user.bio || "" });
      setAvatarPreview(user.profilePic || null);
    }
    setPendingAvatar(null);
    setIsEditing(false);
    setError("");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const avatarInitial = (displayName[0] || "?").toUpperCase();

  return (
    <div className="profile-page">
      <header className="profile-header">
        <button
          type="button"
          onClick={() => router.back()}
          className="icon-btn"
          aria-label="Go back"
        >
          <MaterialIcon name="arrow_back" />
        </button>

        <h1 className="profile-title">Profile</h1>

        <button
          type="button"
          onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
          className="icon-btn"
          aria-label={isEditing ? "Cancel edit" : "Edit profile"}
        >
          <MaterialIcon name={isEditing ? "close" : "edit_square"} />
        </button>
      </header>

      <main className="profile-main">
        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}

        <section className="avatar-section">
          <div className="avatar-wrapper">
            <div className="avatar-clickable" onClick={() => fileInputRef.current?.click()}>
              {avatarPreview ? (
                <>
                  <img src={avatarPreview} alt={displayName} />
                  <div className="avatar-edit-overlay">
                    <MaterialIcon name="edit" />
                  </div>
                </>
              ) : (
                <>
                  <div className="avatar-initial">{avatarInitial}</div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="change-photo-btn"
                    aria-label="Add photo"
                  >
                    <MaterialIcon name="photo_camera" />
                  </button>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="avatar-file-input"
              onChange={handleAvatarChange}
            />
          </div>

          {isEditing ? (
            <form
              className="profile-edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="form-field">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Your name"
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell something about yourself..."
                  rows={3}
                  className="form-textarea"
                />
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="save-btn"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          ) : (
            <div className="profile-info">
              <h2>{displayName}</h2>
              <p>{displayBio}</p>
              {pendingAvatar && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn btn-primary btn-small"
                  style={{ marginTop: 12 }}
                >
                  {isSaving ? "Saving..." : "Save Photo"}
                </button>
              )}
            </div>
          )}
        </section>

        {!isEditing && (
          <section className="settings-section">
            <div className="settings-title">Settings</div>

            <SettingsItem
              icon="person_outline"
              title="Account Settings"
              subtitle="Email, password, and connected apps"
              onClick={() => setIsEditing(true)}
            />
            <SettingsItem
              icon="verified_user"
              title="Privacy"
              subtitle="Manage visibility and data sharing"
              onClick={() => setShowPrivacy(true)}
            />
            <div className="settings-item">
              <div className="settings-item-icon">
                <MaterialIcon name="notifications" className="settings-icon" />
              </div>
              <div className="settings-item-content">
                <p className="settings-item-title">Notifications</p>
                <p className="settings-item-subtitle">Push and email alerts</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={notificationsOn} onChange={(e) => setNotificationsOn(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <SettingsItem
              icon="palette"
              title="Chat Background"
              subtitle="Change message area background"
              onClick={() => setShowBgPicker(!showBgPicker)}
            />

            {showBgPicker && (
              <div>
                <div className="bg-picker-grid">
                  {Object.entries(BACKGROUNDS).map(([key, val]) => (
                    <button
                      key={key}
                      className={`bg-option ${chatBg === key ? "active" : ""}`}
                      onClick={() => setChatBg(key)}
                    >
                      <span
                        className="bg-swatch"
                        style={{
                          background: val.swatch,
                          border: key === "default" ? "1px solid rgba(255,255,255,0.06)" : "none",
                        }}
                      />
                      <span className="bg-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </button>
                  ))}
                  <button
                    className={`bg-option ${chatBg === "custom" ? "active" : ""}`}
                    onClick={() => setChatBg("custom")}
                  >
                    <span
                      className="bg-swatch"
                      style={{ background: customColor }}
                    />
                    <span className="bg-label">Custom</span>
                  </button>
                </div>
                {chatBg === "custom" && (
                  <div className="custom-color-row">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="color-picker-input"
                    />
                    <span className="color-hex-label">{customColor}</span>
                  </div>
                )}
              </div>
            )}

            <div className="settings-title" style={{ marginTop: 24 }}>
              Support
            </div>

            <SettingsItem icon="help_center" title="Help & Support" subtitle="Get help or contact us" onClick={() => setShowHelp(true)} />
            <SettingsItem
              icon="info"
              title="About Us"
              subtitle="App info and credits"
              onClick={() => setShowAbout(true)}
            />
            <SettingsItem
              icon="logout"
              title="Logout"
              danger
              onClick={handleLogout}
            />
          </section>
        )}

        <div className="profile-footer-icon">
          <MaterialIcon name="architecture" style={{ fontSize: 48 }} />
        </div>

        {showPrivacy && (
          <div className="about-overlay" onClick={() => setShowPrivacy(false)}>
            <div className="about-modal" onClick={(e) => e.stopPropagation()}>
              <div className="about-header">
                <h2>Privacy & Security</h2>
                <button className="icon-btn" onClick={() => setShowPrivacy(false)}>
                  <MaterialIcon name="close" />
                </button>
              </div>
              <div className="about-body" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                <div className="about-logo" style={{ alignSelf: 'center' }}>
                  <MaterialIcon name="verified_user" style={{ fontSize: 48 }} />
                </div>
                <p className="about-desc" style={{ maxWidth: '100%', fontSize: 13, lineHeight: 1.7 }}>
                  <strong>Your privacy matters to us.</strong> We use end-to-end encryption to protect your messages, so only you and the person you're talking to can read them — not even we can.
                </p>
                <p className="about-desc" style={{ maxWidth: '100%', fontSize: 13, lineHeight: 1.7 }}>
                  Your password is securely hashed and never stored in plain text. We follow industry best practices to keep your account safe.
                </p>
                <p className="about-desc" style={{ maxWidth: '100%', fontSize: 13, lineHeight: 1.7 }}>
                  To maintain a safe community, we monitor visit activity for suspicious behavior. This helps us detect and prevent unauthorized access, spam, and abuse.
                </p>
                <p className="about-desc" style={{ maxWidth: '100%', fontSize: 13, lineHeight: 1.7 }}>
                  Your trust is our priority. We are committed to protecting your data and being transparent about how it is used.
                </p>
              </div>
            </div>
          </div>
        )}

        {showHelp && (
          <div className="about-overlay" onClick={() => setShowHelp(false)}>
            <div className="about-modal" onClick={(e) => e.stopPropagation()}>
              <div className="about-header">
                <h2>Help & Support</h2>
                <button className="icon-btn" onClick={() => setShowHelp(false)}>
                  <MaterialIcon name="close" />
                </button>
              </div>
              <div className="about-body" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                <div className="about-logo" style={{ alignSelf: 'center' }}>
                  <MaterialIcon name="help_center" style={{ fontSize: 48 }} />
                </div>
                <p className="about-desc" style={{ maxWidth: '100%', fontSize: 13, lineHeight: 1.7 }}>
                  Having a problem? Feel free to reach out to me anytime. I'll get back to you as soon as I can.
                </p>
                <div className="contact-row">
                  <MaterialIcon name="mail" className="contact-icon" />
                  <div>
                    <p className="contact-label">Email</p>
                    <p className="contact-value">bilal.dev121@gmail.com</p>
                  </div>
                </div>
                <div className="contact-row">
                  <MaterialIcon name="alternate_email" className="contact-icon" />
                  <div>
                    <p className="contact-label">Discord</p>
                    <p className="contact-value">bilal.prime2.0</p>
                  </div>
                </div>
                <div className="contact-row">
                  <MaterialIcon name="call" className="contact-icon" />
                  <div>
                    <p className="contact-label">Phone</p>
                    <p className="contact-value">03291035406</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAbout && (
          <div className="about-overlay" onClick={() => setShowAbout(false)}>
            <div className="about-modal" onClick={(e) => e.stopPropagation()}>
              <div className="about-header">
                <h2>About Echofy</h2>
                <button className="icon-btn" onClick={() => setShowAbout(false)}>
                  <MaterialIcon name="close" />
                </button>
              </div>
              <div className="about-body">
                <div className="about-logo">
                  <MaterialIcon name="architecture" style={{ fontSize: 48 }} />
                </div>
                <p className="about-version">Version 1.0.0</p>
                <p className="about-desc">
                  Echofy is a simple and fast chat app. I'm passionate about building great experiences and I keep updating Echofy with new features to make it better for everyone.
                </p>
                <div className="about-divider" />
                <p className="about-credit">
                  Developer — Bilal Dev
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
