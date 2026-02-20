// StreakService.js - Manages user logging streaks
// Based on market research: Streaks are the most powerful retention mechanic

import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getLocalISODate } from '../utils/dateUtils';

export const StreakService = {
    /**
     * Get the user's current streak data
     */
    async getStreak(uid) {
        const streakRef = doc(db, "users", uid, "settings", "streak");
        const snapshot = await getDoc(streakRef);

        if (!snapshot.exists()) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastLogDate: null,
                streakFreezes: 1, // Pro users get streak freezes
                totalDaysLogged: 0
            };
        }

        return snapshot.data();
    },

    /**
     * Update streak when user logs a transaction
     * Returns the new streak count and any milestone reached
     */
    async recordLog(uid) {
        const streakRef = doc(db, "users", uid, "settings", "streak");
        const streakData = await this.getStreak(uid);

        const todayStr = getLocalISODate();

        // If already logged today, just return current streak
        if (streakData.lastLogDate === todayStr) {
            return {
                streak: streakData.currentStreak,
                milestone: null,
                isNewDay: false
            };
        }

        let newStreak = 1;
        let milestone = null;

        if (streakData.lastLogDate) {
            // Parse lastLogDate as local date parts to avoid UTC shift
            const [ly, lm, ld] = streakData.lastLogDate.split('-').map(Number);
            const lastDateLocal = new Date(ly, lm - 1, ld);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getLocalISODate(yesterday);

            if (streakData.lastLogDate === yesterdayStr) {
                // Consecutive day - increment streak
                newStreak = streakData.currentStreak + 1;
            } else {
                // Streak broken - check if we have a freeze
                const daysMissed = Math.round((today - lastDateLocal) / (1000 * 60 * 60 * 24));
                if (daysMissed <= 2 && streakData.streakFreezes > 0) {
                    // Use freeze to maintain streak
                    newStreak = streakData.currentStreak + 1;
                    streakData.streakFreezes -= 1;
                }
                // Otherwise streak resets to 1
            }
        }

        // Check for milestones
        const milestones = [7, 14, 30, 60, 100, 365];
        if (milestones.includes(newStreak)) {
            milestone = newStreak;
        }

        const newLongest = Math.max(newStreak, streakData.longestStreak || 0);

        await setDoc(streakRef, {
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastLogDate: todayStr,
            streakFreezes: streakData.streakFreezes ?? 1,
            totalDaysLogged: (streakData.totalDaysLogged || 0) + 1,
            updatedAt: serverTimestamp()
        });

        return {
            streak: newStreak,
            longestStreak: newLongest,
            milestone,
            isNewDay: true
        };
    },

    /**
     * Subscribe to streak updates
     */
    subscribeToStreak(uid, callback) {
        const streakRef = doc(db, "users", uid, "settings", "streak");

        // Real-time updates using static import
        return onSnapshot(streakRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data());
            } else {
                callback({
                    currentStreak: 0,
                    longestStreak: 0,
                    lastLogDate: null,
                    streakFreezes: 1,
                    totalDaysLogged: 0
                });
            }
        });
    },

    /**
     * Get motivational message based on streak
     */
    getStreakMessage(streak) {
        if (streak === 0) return "Start your streak today!";
        if (streak === 1) return "Great start! Keep going!";
        if (streak < 7) return `${streak} days! Building momentum...`;
        if (streak === 7) return "🎉 One week! You're on fire!";
        if (streak < 14) return `${streak} days! Almost 2 weeks!`;
        if (streak === 14) return "🎉 Two weeks straight!";
        if (streak < 30) return `${streak} days! Crushing it!`;
        if (streak === 30) return "🏆 30 days! You're a pro!";
        if (streak < 100) return `${streak} days! Legendary!`;
        if (streak >= 100) return `🔥 ${streak} days! Unstoppable!`;
        return `${streak} day streak!`;
    }
};
