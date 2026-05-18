"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import useAuthStore from "@/store/authStore";
import "./login.css";

const testimonials = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Amazing platform! The user experience is seamless and the features are exactly what I needed.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "This service has transformed how I work. Clean design, powerful features, and excellent support.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity.",
  },
];

export default function SignInPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login({ username: formData.username, password: formData.password });

      router.push("/chat");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Something went wrong",
      );
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: integrate your OAuth provider
    console.log("Google sign-in");
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    // TODO: navigate to reset password page or open modal
    console.log("Reset password");
  };

  return (
    <div className="signin-container">
      {/* Left side – Form */}
      <section className="signin-left">
        <div className="signin-left-inner">
          <h1 className="signin-title animate-element animate-delay-100">
            Echofy
          </h1>
          <p className="signin-subtitle animate-element animate-delay-200">
            Login to your account
          </p>

          {error && (
            <p className="error-msg animate-element animate-delay-250">
              {error}
            </p>
          )}

          <form className="signin-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field animate-element animate-delay-300">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <div className="glass-input-wrapper">
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-field animate-element animate-delay-400">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="glass-input-wrapper input-with-icon">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                      <path d="m2 2 20 20" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="checkbox-row animate-element animate-delay-500">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="custom-checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Keep me signed in</span>
              </label>
              <a href="#" className="reset-link" onClick={handleResetPassword}>
                Reset password
              </a>
            </div>

            <button
              type="submit"
              className="btn-primary animate-element animate-delay-600"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <div className="divider-wrapper animate-element animate-delay-700">
            <span className="divider-line"></span>
            <span className="divider-text">Or continue with</span>
          </div>

          <button
            type="button"
            className="btn-outline animate-element animate-delay-800"
            onClick={handleGoogleSignIn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="20"
              height="20"
            >
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="create-account-text animate-element animate-delay-900">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="create-account-link">
              Register
            </Link>
          </p>
        </div>
      </section>

      {/* Right side – Hero + testimonials */}
      <section className="signin-right">
        <div
          className="hero-image animate-slide-right animate-delay-300"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80)",
          }}
          role="img"
          aria-label="Decorative hero background"
        />

        {testimonials.length > 0 && (
          <div className="testimonials-strip">
            {testimonials.map((testimonial, index) => {
              const cardClass = `testimonial-card testimonial-card-${index + 1}`;
              const delayClass = `animate-delay-${1000 + index * 200}`;
              return (
                <div
                  key={index}
                  className={`${cardClass} animate-testimonial ${delayClass}`}
                >
                  <Image
                    className="testimonial-avatar"
                    src="/vercel.svg"
                    width={10}
                    height={10}
                    alt="avatar"
                    loading="lazy"
                  />
                  <div className="testimonial-content">
                    <p className="testimonial-name">{testimonial.name}</p>
                    <p className="testimonial-handle">{testimonial.handle}</p>
                    <p className="testimonial-text">{testimonial.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
