import React, { useState } from 'react';
import { FirebaseService } from '../../services/FirebaseService';
import { Compass, Loader2, Fingerprint } from 'lucide-react';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let result;
            if (isLogin) {
                result = await FirebaseService.login(email, password);

                // If login successful and on mobile, check if we should save credentials
                if (result.user && Capacitor.getPlatform() !== 'web') {
                    try {
                        const biometryAvailable = await NativeBiometric.isAvailable();
                        if (biometryAvailable.isAvailable) {
                            await NativeBiometric.setCredentials({
                                username: email,
                                password: password,
                                server: "com.horizon.pfm"
                            });
                        }
                    } catch (e) {
                        console.error("Failed to save credentials for biometrics:", e);
                    }
                }
            } else {
                result = await FirebaseService.signUp(email, password);
            }
            // Initialize user document for admin visibility
            if (result.user) {
                await FirebaseService.initializeUserDocument(result.user.uid, {
                    email: result.user.email,
                    displayName: result.user.displayName
                });
            }
        } catch (err) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-emerald rounded-2xl mb-4 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
                        <Compass className="text-black w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black text-white italic tracking-tight uppercase">Horizon</h1>
                    <p className="mt-2 text-slate-400 font-medium tracking-wide">Financial Navigation for the Modern Age</p>
                </div>

                <div className="card shadow-2xl border-slate-800/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-brand-emerald focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                placeholder="pilot@horizon.ai"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-brand-emerald focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm text-center px-2">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-4 text-lg shadow-[0_10px_20px_-10px_rgba(16,185,129,0.3)] flex items-center justify-center space-x-2"
                        >
                            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                                <span>{isLogin ? 'Initialize Session' : 'Create New Account'}</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-between">
                        <span className="border-b border-slate-800 w-full"></span>
                        <span className="text-xs text-slate-500 uppercase font-black px-4 whitespace-nowrap">OR</span>
                        <span className="border-b border-slate-800 w-full"></span>
                    </div>

                    <button
                        onClick={async () => {
                            setLoading(true);
                            setError(null);
                            try {
                                const result = await FirebaseService.loginWithGoogle();
                                // Initialize user document for admin visibility
                                if (result.user) {
                                    await FirebaseService.initializeUserDocument(result.user.uid, {
                                        email: result.user.email,
                                        displayName: result.user.displayName
                                    });
                                }
                            } catch (err) {
                                setError(err.message || "Google authentication failed");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-4 rounded-xl border border-slate-700 flex items-center justify-center space-x-3 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    {Capacitor.getPlatform() !== 'web' && (
                        <button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const result = await NativeBiometric.getCredentials({ server: "com.horizon.pfm" });
                                    if (result.username && result.password) {
                                        await FirebaseService.login(result.username, result.password);
                                    } else {
                                        setError("No biometric credentials found. Please log in normally once.");
                                    }
                                } catch (err) {
                                    console.error('Biometric login failed:', err);
                                    setError("Biometric login failed. Please use email/password.");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="mt-4 w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold py-4 rounded-xl border border-emerald-500/30 flex items-center justify-center space-x-3 transition-colors"
                        >
                            <Fingerprint className="w-5 h-5" />
                            <span>Login with Biometrics</span>
                        </button>
                    )}


                    <div className="mt-8 text-center border-t border-slate-800/50 pt-6">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-slate-400 hover:text-brand-emerald transition-colors text-sm font-medium"
                        >
                            {isLogin ? "New here? Establish a new account" : "Back to base (Login)"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
