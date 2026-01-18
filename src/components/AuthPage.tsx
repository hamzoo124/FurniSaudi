import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Home, User, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabaseAdmin as supabase } from '@/lib/supabase';

export const AuthPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    city: "",
    businessName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // =====================
      // LOGIN
      // =====================
      if (isLogin) {
        const result = await signIn(formData.email, formData.password);

        if (result.error) {
          setError(result.error);
        } else {
          // USER ROLE COMES BACK FROM SIGNIN → NOW DECIDE WHERE TO GO
          if (result.role === "seller") navigate("/seller-dashboard");
          else if (result.role === "admin") navigate("/admin-dashboard");
          else navigate("/");
        }
      }

      // =====================
      // SIGNUP
      // =====================
      else {
        const result = await signUp(
          formData.email,
          formData.password,
          formData.name,
          role,
          formData.phone,
          formData.city,
          formData.businessName
        );

        if (result.error) {
          setError(result.error);
        } else {
          if (role === "seller") navigate("/seller-registration");
          else navigate("/");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-amber-500 px-6 py-3 rounded-lg shadow-lg mb-4">
            <Home className="w-8 h-8 text-white" />
            <span className="text-white font-bold text-2xl">FurniSouq</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-gray-600">
            {isLogin ? "Sign in to continue" : "Join FurniSouq today"}
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* ROLE SELECTION */}
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I want to:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("buyer")}
                  className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                    role === "buyer"
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-300"
                  }`}
                >
                  <User className="w-5 h-5" /> <span>Buy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("seller")}
                  className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                    role === "seller"
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-300"
                  }`}
                >
                  <Store className="w-5 h-5" /> <span>Sell</span>
                </button>
              </div>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* SIGNUP EXTRA FIELDS */}
            {!isLogin && (
              <>
                {/* name */}
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input-style"
                    placeholder="Your name"
                  />
                </div>

                {/* buyer fields */}
                {role === "buyer" && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <input
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="input-style"
                        placeholder="+966 XXX XXX XXX"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">City</label>
                      <input
                        required
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="input-style"
                        placeholder="City"
                      />
                    </div>
                  </>
                )}

                {/* seller fields */}
                {role === "seller" && (
                  <>
                    <div>
                      <label className="text-sm font-medium">
                        Business Name
                      </label>
                      <input
                        required
                        value={formData.businessName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            businessName: e.target.value,
                          })
                        }
                        className="input-style"
                        placeholder="Business name"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">City</label>
                      <input
                        required
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="input-style"
                        placeholder="City"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input-style"
                placeholder="you@example.com"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="input-style"
                placeholder="Enter your password"
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="bg-red-200 text-red-800 p-3 rounded">
                {error}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-white py-3 rounded-lg"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* SWITCH LOGIN/SIGNUP */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setError("");
                setIsLogin(!isLogin);
              }}
              className="text-amber-600"
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </button>
          </div>

          {/* GUEST */}
          <div className="mt-6 border-t pt-4 text-center">
            <button onClick={() => navigate("/")} className="text-gray-700">
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

