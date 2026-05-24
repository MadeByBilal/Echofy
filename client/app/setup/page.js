"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import useAuthStore from "@/store/authStore";
import BottomNav from "@/components/ui/BottomNav";
import MaterialIcon from "@/components/ui/MaterialIcon";
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
            {avatarPreview ? (
              <img src={avatarPreview} alt={displayName} />
            ) : (
              <div className="avatar-initial">{avatarInitial}</div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="change-photo-btn"
              aria-label="Change photo"
            >
              <MaterialIcon name="photo_camera" />
            </button>

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
            />
            <SettingsItem
              icon="notifications"
              title="Notifications"
              subtitle="Customize push and email alerts"
              badge="OFF"
            />

            <div className="settings-title" style={{ marginTop: 24 }}>
              Support
            </div>

            <SettingsItem icon="help_center" title="Help & Support" />
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
      </main>
      <BottomNav />
    </div>
  );
}
